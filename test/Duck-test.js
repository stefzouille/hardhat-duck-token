/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { expect } = require('chai');

describe('Duck token', function () {
  let dev, owner, alice, bob, charlie, dan, Duck, duck;
  const INIT_SUPPLY = ethers.utils.parseEther('1000000');
  const NAME = 'Duck';
  const SYMBOL = 'DCK';
  const DECIMALS = 18;
  beforeEach(async function () {
    [dev, owner, alice, bob, charlie, dan] = await ethers.getSigners();
    Duck = await ethers.getContractFactory('Duck');
    const ethBalanceBefore = await alice.getBalance();
    duck = await Duck.connect(dev).deploy(owner.address, INIT_SUPPLY);
    await duck.deployed();
  });
  describe('Deployment', function () {
    it(`Should have name ${NAME}`, async function () {
      expect(await duck.name()).to.equal(NAME);
    });
    it(`Should have symbol ${SYMBOL}`, async function () {
      expect(await duck.symbol()).to.equal(SYMBOL);
    });
    it(`Should have decimals ${DECIMALS}`, async function () {
      expect(await duck.decimals()).to.equal(DECIMALS);
    });
    it(`Should have total supply ${INIT_SUPPLY.toString()}`, async function () {
      expect(await duck.totalSupply()).to.equal(INIT_SUPPLY);
    });
    it(`Should mint total supply ${INIT_SUPPLY.toString()} to owner`, async function () {
      expect(await duck.balanceOf(owner.address)).to.equal(INIT_SUPPLY);
    });
    it('Should emit Transfer at deployment', async function () {
      const receipt = await duck.deployTransaction.wait();
      const txHash = receipt.transactionHash;
      await expect(txHash).to.emit(duck, 'Transfer').withArgs(ethers.constants.AddressZero, owner.address, INIT_SUPPLY);
    });
  });
  describe('Allowance', function () {
    it('owner can allow spender', async function () {
      await duck.connect(alice).approve(charlie.address, 200);
      expect(await duck.allowance(alice.address, charlie.address)).to.equal(200);
    });
    it('Should change old allowance', async function () {
      await duck.connect(alice).approve(charlie.address, 200);
      await duck.connect(alice).approve(charlie.address, 150);
      expect(await duck.allowance(alice.address, charlie.address)).to.equal(150);
    });
    it('Should revert if owners allow zero-address', async function () {
      await expect(duck.connect(alice).approve(ethers.constants.AddressZero, 1000)).to.revertedWith(
        'Duck: approve to the zero address'
      );
    });
    it('Should emit Approval event', async function () {
      await expect(duck.connect(alice).approve(charlie.address, 200))
        .to.emit(duck, 'Approval')
        .withArgs(alice.address, charlie.address, 200);
    });
  });

  describe('Token Transfers', function () {
    const ALICE_INIT_BALANCE = ethers.utils.parseEther('1000');
    const BOB_INIT_BALANCE = ethers.utils.parseEther('500');
    beforeEach(async function () {
      await duck.connect(owner).transfer(alice.address, ALICE_INIT_BALANCE);
      await duck.connect(owner).transfer(bob.address, BOB_INIT_BALANCE);
    });
    it('Should transfer token from sender to recipient', async function () {
      await duck.connect(alice).transfer(bob.address, 1);
      expect(await duck.balanceOf(alice.address)).to.equal(ALICE_INIT_BALANCE.sub(1));
      expect(await duck.balanceOf(bob.address)).to.equal(BOB_INIT_BALANCE.add(1));
    });

    it('Should transferFrom token from sender to recipient', async function () {
      await duck.connect(alice).approve(charlie.address, 200);
      await duck.connect(charlie).transferFrom(alice.address, dan.address, 150);
      expect(await duck.balanceOf(alice.address)).to.equal(ALICE_INIT_BALANCE.sub(150));
      expect(await duck.balanceOf(dan.address)).to.equal(150);
    });

    it('Should decrease allowance when transferFrom to recipient', async function () {
      await duck.connect(alice).approve(charlie.address, 200);
      await duck.connect(charlie).transferFrom(alice.address, dan.address, 150);
      expect(await duck.allowance(alice.address, charlie.address)).to.equal(200 - 150);
    });

    it('Should revert when transferFrom amount exceeds balance', async function () {
      await duck.connect(alice).approve(charlie.address, INIT_SUPPLY);
      await expect(
        duck.connect(charlie).transferFrom(alice.address, dan.address, ALICE_INIT_BALANCE.add(1))
      ).to.revertedWith('Duck: transfer amount exceeds balance');
    });

    it('Should revert if transfer to zero-address', async function () {
      await expect(duck.connect(alice).transfer(ethers.constants.AddressZero, 1)).to.revertedWith(
        'Duck: transfer to the zero address'
      );
    });

    it('Should revert when transferFrom amount exceeds allowance', async function () {
      await duck.connect(alice).approve(charlie.address, 200);
      await expect(duck.connect(charlie).transferFrom(alice.address, dan.address, 200 + 1)).to.revertedWith(
        'Duck: transfer amount exceeds allowance'
      );
    });

    it('Should revert when transferFrom to zero-address', async function () {
      await duck.connect(alice).approve(charlie.address, INIT_SUPPLY);
      await expect(duck.connect(charlie).transferFrom(alice.address, ethers.constants.AddressZero, 10)).to.revertedWith(
        'Duck: transfer to the zero address'
      );
    });

    it('Should revert when transfer amount exceeds balance', async function () {
      await expect(duck.connect(alice).transfer(charlie.address, ALICE_INIT_BALANCE.add(1))).to.revertedWith(
        'Duck: transfer amount exceeds balance'
      );
    });
    it('Should emit Transfer event', async function () {
      await expect(duck.connect(alice).transfer(charlie.address, 500))
        .to.emit(duck, 'Transfer')
        .withArgs(alice.address, charlie.address, 500);
    });

    it('Should emit Transfer event when transferFrom', async function () {
      await duck.connect(alice).approve(charlie.address, 200);
      await expect(duck.connect(charlie).transferFrom(alice.address, dan.address, 150))
        .to.emit(duck, 'Transfer')
        .withArgs(alice.address, dan.address, 150);
    });
  });
});
