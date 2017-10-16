var MiniMeTokenFactory = artifacts.require("./MiniMeToken.sol");
var MiniMeToken = artifacts.require("./MiniMeToken.sol");
var Hashtag = artifacts.require("./HashtagSimpleDeal.sol");

contract('HashtagSimpleDeal', function(accounts) {

  var swtToken;
  var hashtagProviderRepToken;
  var hashtagSeekerRepToken;
  var miniMeTokenFactory;
  var hashtagContract;
  var dealContract;
  var hashtagcommission = 2;
  var gasStats = [];
  var payoutaddress = accounts[4];

  var self = this;

  describe('Deploy MiniMeToken TokenFactory', function() {
    it("should deploy MiniMeToken contract", function(done) {
      MiniMeTokenFactory.new().then(function(_miniMeTokenFactory) {
        assert.ok(_miniMeTokenFactory.address);
        miniMeTokenFactory = _miniMeTokenFactory;
        done();
      });
    });
  });

  describe('Deploy SWT (test) Token', function() {
    it("should deploy a MiniMeToken contract", function(done) {
      MiniMeToken.new(
        miniMeTokenFactory.address,
        0,
        0,
        "Swarm City Token",
        18,
        "SWT",
        true
      ).then(function(_miniMeToken) {
        assert.ok(_miniMeToken.address);
        swtToken = _miniMeToken;
        done();
      });
    });

    it("should mint SWT tokens for Seeker", function(done) {
      swtToken.generateTokens(accounts[1], 100).then(function() {
        done();
      });
    });

    it("should see token balance Seeker account", function(done) {
      swtToken.balanceOf(accounts[1]).then(function(balance) {
        assert.equal(balance.toNumber(), 100, "seeker balance not correct after swt minting");
        done();
      });
    });

    it("should mint SWT tokens for Provider", function(done) {
      swtToken.generateTokens(accounts[2], 100).then(function() {
        done();
      });
    });

    it("should see token balance Provider account", function(done) {
      swtToken.balanceOf(accounts[2]).then(function(balance) {
        assert.equal(balance.toNumber(), 100, "provider balance not correct after swt minting");
        done();
      });
    });
  });

  describe('Hashtag Simple Deal creation flow', function() {

    it("should deploy a ProviderRep minime contract", function(done) {
      MiniMeToken.new(
        miniMeTokenFactory.address,
        0,
        0,
        "Swarm City Provider Rep",
        0,
        "SWR",
        false
      ).then(function(_miniMeToken) {
        assert.ok(_miniMeToken.address);
        hashtagProviderRepToken = _miniMeToken; //.address;
        done();
      });
    });

    it("should deploy a SeekerRep minime contract", function(done) {
      MiniMeToken.new(
        miniMeTokenFactory.address,
        0,
        0,
        "Swarm City Seeker Rep",
        0,
        "SWR",
        false
      ).then(function(_miniMeToken) {
        assert.ok(_miniMeToken.address);
        hashtagSeekerRepToken = _miniMeToken; //.adddress;
        done();
      });
    });


    it("should deploy 'PioneerTest' Hashtag", function(done) {

      // commission for this hastag is hashtagcommission SWT
      Hashtag.new(swtToken.address, "PioneerTest", hashtagcommission, "QmNogIets", hashtagProviderRepToken.address, hashtagSeekerRepToken.address).then(function(instance) {
        //console.log(instance);
        hashtagContract = instance;
        assert.isNotNull(hashtagContract);
        //console.log(hashtagContract);
        // hashtagContract.getProviderRepTokenAddress.call().then(function(tokenaddress) {
        //   hashtagProviderRepToken = MiniMeToken.at(tokenaddress);
        //   hashtagContract.getSeekerRepTokenAddress.call().then(function(tokenaddress) {
        //     hashtagSeekerRepToken = MiniMeToken.at(tokenaddress);
        //     done();
        //   });
        // });
        done();
      });
    });

    it("should change controller of ProviderRepToken to 'PioneerTest' Hashtag", function(done) {

      hashtagProviderRepToken.changeController(hashtagContract.address).then(function() {
        hashtagProviderRepToken.controller.call().then(function(controller){
          assert.equal(controller,hashtagContract.address, "controller should be PioneerTest");
          done();
        });
      });
    });

    it("should change controller of ProviderRepToken to 'PioneerTest' Hashtag", function(done) {
      hashtagSeekerRepToken.changeController(hashtagContract.address).then(function() {
        hashtagSeekerRepToken.controller.call().then(function(controller){
          assert.equal(controller,hashtagContract.address, "controller should be PioneerTest");
          done();
        });
      });
    });

    it("should set payout address to address[4]", function(done) {
      hashtagContract.setPayoutAddress(payoutaddress, {
        gas: 4700000,
        from: accounts[0]
      }).then(function(res) {
        gasStats.push({
          name: 'setPayoutAddress',
          gasUsed: res.receipt.gasUsed
        });
        done();
      });
    });

    it("should verify the payout address of the  'pioneer' Hashtag", function(done) {
      hashtagContract.payoutaddress.call().then(function(result) {
        assert.equal(result, payoutaddress, "payout not set...");
        done();
      });
    });

    it("should verify the commission of the  'pioneer' Hashtag", function(done) {
      hashtagContract.commission.call().then(function(result) {
        assert.equal(result.toNumber(), hashtagcommission, "commission not set...");
        done();
      });
    });

    it("should see no REP on Seeker", function(done) {
      hashtagProviderRepToken.balanceOf(accounts[1]).then(function(balance) {
        assert.equal(balance, 0, "accounts[1] provider REP balance not correct");
        done();
      });
    });

    it("should see no REP on Provider", function(done) {
      hashtagSeekerRepToken.balanceOf(accounts[2]).then(function(balance) {
        assert.equal(balance, 0, "accounts[1] seeker REP balance not correct");
        done();
      });
    });

    // it("should add the dealForTwoFactory to the whitelisted factories for this hashtag", function(done) {
    //   hashtagContract.addFactory(dealForTwoFactory.address, {
    //     gas: 4700000,
    //     from: accounts[3]
    //   }).then(function(instance) {
    //     done();
    //   });
    // });

    // it("should see that our dealForTwoFactory is whitelisted for this hashtag", function(done) {
    //   hashtagContract.validFactories.call(dealForTwoFactory.address).then(function(result) {
    //     console.log(result);
    //     assert.equal(result, true, "dealForTwoFactory not whitelisted...");
    //     done();
    //   });
    // });


  });

  describe('SimpleDeal conflict flow', function() {

    it("should give Seeker allowance to HashtagSimpleDeal", function(done) {
      swtToken.approve(hashtagContract.address, 11, {
        from: accounts[1]
      }).then(function(res) {
        //console.log('gas used:', res.receipt.gasUsed);
        gasStats.push({
          name: 'approve (seeker)',
          gasUsed: res.receipt.gasUsed
        });
        done();
      });
    });

    it("should create a new deal", function(done) {
      hashtagContract.makeDealForTwo("TheConflictDeal", 10, "", {
        from: accounts[1],
        gas: 4700000
      }).then(function(res) {
        //console.log('gas used:', res.receipt.gasUsed);
        gasStats.push({
          name: 'makeDealForTwo',
          gasUsed: res.receipt.gasUsed
        });
        done();
      });
    });

    it("should check if the deal exists", function(done) {
      hashtagContract.readDeal.call("TheConflictDeal", accounts[1]).then(function(res) {
        console.log(res[0].toNumber(), res[1].toNumber(), res[2].toNumber(), res[3]);
        done();
      });
    });

    it("should see token balance decreased on seeker's account", function(done) {
      swtToken.balanceOf(accounts[1]).then(function(balance) {
        //assert.equal(balance.toNumber(), 89, "deal balance not correct after funding");
        console.log('Balance of accounts[1] =', balance.toNumber());
        done();
      });
    });

    it("should see token balance on HashtagSimpleDeal", function(done) {
      swtToken.balanceOf(hashtagContract.address).then(function(balance) {
        //assert.equal(balance.toNumber(), 11, "deal balance not correct after funding");
        console.log('Balance of hashtag =', balance.toNumber());
        done();
      });
    });


    it("should give provider allowance to HashtagSimpleDeal", function(done) {
      swtToken.approve(hashtagContract.address, 11, {
        from: accounts[2]
      }).then(function(res) {
        //console.log('gas used:', res.receipt.gasUsed);
        gasStats.push({
          name: 'approve (provider)',
          gasUsed: res.receipt.gasUsed
        });
        done();
      });
    });

    it("should execute fundDeal", function(done) {
      hashtagContract.fundDeal("TheConflictDeal", accounts[1], "", {
        from: accounts[2],
        gas: 4700000
      }).then(function(res) {
        //console.log('gas used:', res.receipt.gasUsed);
        gasStats.push({
          name: 'fundDeal',
          gasUsed: res.receipt.gasUsed
        });
        done();
      });
    });

    it("should check if the deal exists", function(done) {
      hashtagContract.readDeal.call("TheConflictDeal", accounts[1]).then(function(res) {
        console.log(res[0].toNumber(), res[1].toNumber(), res[2].toNumber(), res[3]);
        done();
      });
    });
    it("should see token balance on HashtagSimpleDeal", function(done) {
      swtToken.balanceOf(accounts[0]).then(function(balance) {
        console.log('Balance of HashtagSimpleDeal =', balance.toNumber());
        done();
      });
    });

    it("should see token balance on Seeker", function(done) {
      swtToken.balanceOf(accounts[1]).then(function(balance) {
        console.log('Balance of Seeker =', balance.toNumber());
        done();
      });
    });

    it("should see token balance on Provider", function(done) {
      swtToken.balanceOf(accounts[2]).then(function(balance) {
        console.log('Balance of Provider =', balance.toNumber());
        done();
      });
    });

    it("should see token balance on payoutaddress", function(done) {
      swtToken.balanceOf(accounts[4]).then(function(balance) {
        console.log('Balance of Payout =', balance.toNumber());
        done();
      });
    });

    it("should put the deal in conflict", function(done) {
      hashtagContract.dispute("TheConflictDeal", accounts[1], "", {
        from: accounts[1],
        gas: 4700000
      }).then(function(res) {
        console.log('gas used:', res.receipt.gasUsed);
        gasStats.push({
          name: 'conflict',
          gasUsed: res.receipt.gasUsed
        });
        done();
      });
    });

    it("should check if the deal is in conflict", function(done) {
      hashtagContract.readDeal.call("TheConflictDeal", accounts[1]).then(function(res) {
        console.log(res[0].toNumber(), res[1].toNumber(), res[2].toNumber(), res[3]);
        done();
      });
    });

    it("should resolve the deal", function(done) {
      hashtagContract.resolve("TheConflictDeal", accounts[1], 5, "", {
        from: accounts[0],
        gas: 4700000
      }).then(function(res) {
        console.log('gas used:', res.receipt.gasUsed);
        gasStats.push({
          name: 'resolve',
          gasUsed: res.receipt.gasUsed
        });
        done();
      });
    });

    it("should see token balance on HashtagSimpleDeal", function(done) {
      swtToken.balanceOf(accounts[0]).then(function(balance) {
        console.log('Balance of HashtagSimpleDeal =', balance.toNumber());
        done();
      });
    });

    it("should see token balance on Seeker", function(done) {
      swtToken.balanceOf(accounts[1]).then(function(balance) {
        console.log('Balance of Seeker =', balance.toNumber());
        done();
      });
    });

    it("should see token balance on Provider", function(done) {
      swtToken.balanceOf(accounts[2]).then(function(balance) {
        console.log('Balance of Provider =', balance.toNumber());
        done();
      });
    });

    it("should see token balance on payoutaddress", function(done) {
      swtToken.balanceOf(accounts[4]).then(function(balance) {
        console.log('Balance of Payout =', balance.toNumber());
        done();
      });
    });

    it("should check if the deal is resolved", function(done) {
      hashtagContract.readDeal.call("TheDeal", accounts[1]).then(function(res) {
        console.log(res[0].toNumber(), res[1].toNumber(), res[2].toNumber(), res[3]);
        done();
      });
    });
  });

  describe('Stats', function() {
    it("should show stats of Happy Flow", function(done) {
      var cumulatedGas = 0;
      for (var i = 0; i < gasStats.length; i++) {
        console.log(gasStats[i]);
        cumulatedGas += gasStats[i].gasUsed;
      }
      console.log('Total gas used', cumulatedGas);
      done();
    });
  });

});
