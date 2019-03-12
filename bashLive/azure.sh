killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server azure live &> trades.ALL.log &
npm run cleanDB server azure live &>> cleanDB.log &
npm run commit server azure live pair=ETH_USD &>> commit.log &
npm run fetchPrice server pair=ETH_USD azure live &>> fetchPrice.log &
npm run events server azure live events=StartReset,StartPreReset $1 &>> events.log &