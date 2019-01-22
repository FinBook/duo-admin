import calculator from './calculator';
import dynamoUtil from './dynamoUtil';
import priceUtil from './priceUtil';
import util from './util';

const schedule = require('node-schedule');

test('getBasePeriod', () => {
	expect(priceUtil.getBasePeriod(1)).toBe(0);
	expect(priceUtil.getBasePeriod(60)).toBe(1);
	expect(() => priceUtil.getBasePeriod(2)).toThrowErrorMatchingSnapshot();
});

const prices = [
	{
		source: 'bitfinex',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958681000,
		period: 0,
		open: 202,
		high: 202,
		low: 202,
		close: 202,
		volume: 0.0007
	},
	{
		source: 'bitfinex',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958681001,
		period: 0,
		open: 205,
		high: 205,
		low: 205,
		close: 205,
		volume: 0.0007
	},
	{
		source: 'kraken',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958681000,
		period: 0,
		open: 207,
		high: 207,
		low: 207,
		close: 207,
		volume: 17.6757
	},
	{
		source: 'kraken',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958681001,
		period: 0,
		open: 210,
		high: 210,
		low: 210,
		close: 210,
		volume: 17.6757
	},
	{
		source: 'gemini',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958609000,
		period: 0,
		open: 214,
		high: 214,
		low: 214,
		close: 214,
		volume: 0.0013
	},
	{
		source: 'gemini',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958609001,
		period: 0,
		open: 210,
		high: 210,
		low: 210,
		close: 210,
		volume: 0.0013
	}
];

const sortedPrices1 = priceUtil.sortPricesByPairPeriod(prices, 1);
const sortedPrices2 = priceUtil.sortPricesByPairPeriod(prices, 60);
test('sortPricesByPairPeriod 1', () => expect(sortedPrices1).toMatchSnapshot());
test('sortPricesByPairPeriod 60', () => expect(sortedPrices2).toMatchSnapshot());

test('getPeriodPrice 1', () => {
	for (const pair in sortedPrices1)
		for (const period in sortedPrices1[pair])
			expect(priceUtil.getPeriodPrice(sortedPrices1[pair][period], 1)).toMatchSnapshot();
});

test('getPeriodPrice 60', () => {
	for (const pair in sortedPrices2)
		for (const period in sortedPrices2[pair])
			expect(priceUtil.getPeriodPrice(sortedPrices2[pair][period], 60)).toMatchSnapshot();
});

test('aggregatePrice', async () => {
	dynamoUtil.getPrices = jest.fn((src: string) =>
		Promise.resolve(prices.filter(price => price.source === src))
	);
	dynamoUtil.addPrice = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => Math.max(...prices.map(price => price.timestamp)) + 1);

	await priceUtil.aggregatePrice(1);
	expect((dynamoUtil.getPrices as jest.Mock).mock.calls).toMatchSnapshot();
	expect((dynamoUtil.addPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

const magiWrapper = {
	web3Wrapper: {
		getTransactionCount: jest.fn(() => 100),
		getGasPrice: jest.fn(() => Promise.resolve(1000000000))
	},
	isStarted: jest.fn(() => true),
	address: 'magiAddress',
	getLastPrice: jest.fn(() => ({
		price: 100,
		timestamp: 2234567890000
	})),
	commitPrice: jest.fn(),
	startMagi: jest.fn()
} as any;
const dualClassWrapper = {
	web3Wrapper: {
		getTransactionCount: jest.fn(() => 100),
		getGasPrice: jest.fn(() => Promise.resolve(1000000000))
	},
	getStates: jest.fn(() =>
		Promise.resolve({
			state: 'Trading',
			lastPriceTime: 1234567890000
		} as any)
	),
	fetchPrice: jest.fn()
} as any;

test('fetchPrice, not started', async () => {
	global.setInterval = jest.fn();
	magiWrapper.isStarted = jest.fn(() => false);
	await priceUtil.fetchPrice('account', [dualClassWrapper], magiWrapper, 1000000000);
	expect(dualClassWrapper.web3Wrapper.getTransactionCount as jest.Mock).not.toBeCalled();
});

test('fetchPrice gasPrice', async () => {
	global.setInterval = jest.fn();
	magiWrapper.isStarted = jest.fn(() => true);

	await priceUtil.fetchPrice('account', [dualClassWrapper], magiWrapper, 1000000000);
	await (global.setInterval as jest.Mock).mock.calls[0][0]();
	expect((dualClassWrapper.fetchPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('fetchPrice', async () => {
	global.setInterval = jest.fn();
	magiWrapper.isStarted = jest.fn(() => true);
	magiWrapper.web3Wrapper.getGasPrice = jest.fn(() => Promise.resolve(1000000000));
	await priceUtil.fetchPrice('account', [dualClassWrapper], magiWrapper);
	await (global.setInterval as jest.Mock).mock.calls[0][0]();
	expect((dualClassWrapper.fetchPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('commitPrice', async () => {
	calculator.getPriceFix = jest.fn(() =>
		Promise.resolve({
			price: 100,
			timestamp: 1234567890000
		})
	);
	magiWrapper.web3Wrapper.getGasPrice = jest.fn(() => 1000000000);

	await priceUtil.commitPrice('account', magiWrapper, 'quote|base');

	expect((magiWrapper.commitPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('commitPrice gasPrice', async () => {
	calculator.getPriceFix = jest.fn(() =>
		Promise.resolve({
			price: 100,
			timestamp: 1234567890000
		})
	);

	await priceUtil.commitPrice('account', magiWrapper, 'quote|base', 1000000000);

	expect((magiWrapper.commitPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startMagi', async () => {
	calculator.getPriceFix = jest.fn(() =>
		Promise.resolve({
			price: 100,
			timestamp: 1234567890000
		})
	);

	await priceUtil.startMagi('account', magiWrapper, 'quote|base');

	expect((magiWrapper.startMagi as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startMagi gasPrice', async () => {
	calculator.getPriceFix = jest.fn(() =>
		Promise.resolve({
			price: 100,
			timestamp: 1234567890000
		})
	);

	await priceUtil.startMagi('account', magiWrapper, 'quote|base', 1000000000);

	expect((magiWrapper.startMagi as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startAggregate', async () => {
	global.setInterval = jest.fn();
	dynamoUtil.insertHeartbeat = jest.fn();
	priceUtil.aggregatePrice = jest.fn();
	await priceUtil.startAggregate(10);

	(global.setInterval as jest.Mock).mock.calls[0][0]();
	(global.setInterval as jest.Mock).mock.calls[1][0]();
	expect((dynamoUtil.insertHeartbeat as jest.Mock).mock.calls).toMatchSnapshot();
	expect((priceUtil.aggregatePrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startCommitPrices', async () => {
	schedule.RecurrenceRule = jest.fn().mockImplementation(() => ({}));
	schedule.scheduleJob = jest.fn();
	util.getUTCNowTimestamp = jest.fn(() => 1234567890000);
	priceUtil.startMagi = jest.fn(() => Promise.resolve());
	priceUtil.commitPrice = jest.fn(() => Promise.resolve());
	await priceUtil.startCommitPrices('account', magiWrapper, 'ETH|USD');
	expect((schedule.scheduleJob as jest.Mock).mock.calls).toMatchSnapshot();
	await (schedule.scheduleJob as jest.Mock).mock.calls[0][1]();
	expect(priceUtil.startMagi as jest.Mock).not.toBeCalled();
	expect((priceUtil.commitPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startCommitPrices not started', async () => {
	schedule.RecurrenceRule = jest.fn().mockImplementation(() => ({}));
	schedule.scheduleJob = jest.fn();
	util.getUTCNowTimestamp = jest.fn(() => 1234567890000);
	priceUtil.startMagi = jest.fn(() => Promise.resolve());
	priceUtil.commitPrice = jest.fn(() => Promise.resolve());
	magiWrapper.isStarted = jest.fn(() => false);
	await priceUtil.startCommitPrices('account', magiWrapper, 'ETH|USD', 1000000000);
	expect((schedule.scheduleJob as jest.Mock).mock.calls).toMatchSnapshot();
	await (schedule.scheduleJob as jest.Mock).mock.calls[0][1]();
	await (schedule.scheduleJob as jest.Mock).mock.calls[1][1]();
	expect((priceUtil.startMagi as jest.Mock).mock.calls).toMatchSnapshot();
	expect((priceUtil.commitPrice as jest.Mock).mock.calls).toMatchSnapshot();
});
