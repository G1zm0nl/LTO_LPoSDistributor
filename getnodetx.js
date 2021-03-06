var request = require('sync-request');lto
var fs = require('fs');

/**
 *    
 * Put your settings here:
 *     - startBlockHeight: the block from which you want to start distribution for
 *     - endBlock: the block until you want to distribute the earnings
 *     - assetId: find transactions of this asset
 *     - assetdecimals: for showing the correct amount of the asset    
 *     - node: address of your node in the form http://<ip>:<port
 */
var config = {
    startBlockHeight: 750336,
    endBlock: 760412,
    assetId: "5BK9HPKmSkxoMdqvDzneb2UaW2NzDRjoMpMvQWfB4NcK", //NodeTX2
    assetdecimals: 8,
    node: 'http://217.100.219.250:6869'
};
 

var currentStartBlock = config.startBlockHeight;

var AssetTxs = [];


/**
  * This method starts the overall process by first downloading the blocks,
  * preparing the necessary datastructures and finally preparing the payments
  * and serializing them into a file that could be used as input for the
  * masspayment tool.
 */
var start = function() {
    console.log('getting blocks...');
    var blocks = getAllBlocks();
    console.log('preparing datastructures...');
    prepareDataStructure(blocks);


    AssetTxs.forEach(function(tx) {
       console.log("Block: " + tx.block + " ID: " + tx.id + " Amount: " + (tx.amount/ Math.pow(10, config.assetdecimals)) + " asset: " + tx.feeAsset + " Recipient: " + tx.recipient + " Sender: " + tx.sender);		
		});                        
      console.log("TXs: " + AssetTxs.length);
};

/**
 * This method organizes the datastructures that are later on necessary
 * for the block-exact analysis of the leases.
 *
 *   @param blocks all blocks that should be considered
 */
 
var prepareDataStructure = function(blocks) {
    blocks.forEach(function(block) {
        block.transactions.forEach(function(transaction) {

                if(transaction.assetId===config.assetId) //nodetx2
            		{
									console.log("Found TX at block: " + block.height + " Amount: " +  transaction.amount);
									transaction.generator = block.generator;
									transaction.block = block.height;
									AssetTxs.push(transaction);
								}
        });
    });
};

/**
 * Method that returns all relevant blocks.
 *
 * @returns {Array} all relevant blocks
 */
var getAllBlocks = function() {
    // leases have been resetted in block 462000, therefore, this is the first relevant block to be considered
    //var firstBlockWithLeases=462000;
    //var currentStartBlock = firstBlockWithLeases;
    var blocks = [];

    while (currentStartBlock < config.endBlock) {
        var currentBlocks;

        if (currentStartBlock + 99 < config.endBlock) {
            console.log('getting blocks from ' + currentStartBlock + ' to ' + (currentStartBlock + 99));
            currentBlocks = JSON.parse(request('GET', config.node + '/blocks/seq/' + currentStartBlock + '/' + (currentStartBlock + 99), {
                'headers': {
                    'Connection': 'keep-alive'
                }
            }).getBody('utf8'));
        } else {
            console.log('getting blocks from ' + currentStartBlock + ' to ' + config.endBlock);
            currentBlocks = JSON.parse(request('GET', config.node + '/blocks/seq/' + currentStartBlock + '/' + config.endBlock, {
                'headers': {
                    'Connection': 'keep-alive'
                }
            }).getBody('utf8'));
        }
        currentBlocks.forEach(function(block) {
            if (block.height <= config.endBlock) {
                blocks.push(block);
            }
        });

        if (currentStartBlock + 100 < config.endBlock) {
            currentStartBlock += 100;
        } else {
            currentStartBlock = config.endBlock;
        }
    }

    return blocks;
};

start();

