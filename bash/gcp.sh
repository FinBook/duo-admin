killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp &> trades.ALL.log &
npm run commit server gcp pairs=ETH_USD &>> commit.log &
npm run cleanDB server gcp &>> cleanDB.log &
npm run round contractType=Vivaldi tenor=100C-1H debug server gcp &>> vivaldi-100C-1H.log &
npm run fetchPrice server pairs=ETH_USD gcp &>> fetchPrice.log &
npm run events server gcp events=StartReset,StartPreReset $1 &>> events.log &