killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server aws &> trades.ALL.log &
npm run commit server aws pair=ETH_USD &>> commit.log &
npm run cleanDB server aws &>> cleanDB.log &
npm run round contractType=Vivaldi tenor=100C-3H debug aws &>> vivaldi-100C-3H.log &