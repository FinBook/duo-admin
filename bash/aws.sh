killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server aws &> trades.ALL.log &
npm run trigger server aws event=StartPreReset &>> preReset.log &
npm run trigger server aws event=StartReset &>> reset.log &
npm run commit server aws pair=ETH_USD &>> commit.log &
npm run fetchPrice server aws &>> fetchPrice.log &
npm run cleanDB server aws &>> cleanDB.log &