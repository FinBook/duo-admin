killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server azure &> trades.ALL.log &
npm run commit server azure pair=ETH_USD &>> commit.log &
npm run cleanDB server azure &>> cleanDB.log &