import moment from 'moment';
import * as CST from '../common/constants';
import { IEvent } from '../common/types';
import conversion from '../samples/dynamo/conversion.json';
import prices from '../samples/dynamo/prices.json';
import status from '../samples/dynamo/status.json';
import totalSupply from '../samples/dynamo/totalSupply.json';
import uiCreate from '../samples/dynamo/uiCreate.json';
import uiRedeem from '../samples/dynamo/uiRedeem.json';
import dynamoUtil from './dynamoUtil';
import util from './util';

jest.mock('aws-sdk/clients/dynamodb', () => jest.fn().mockImplementation(() => ({})));
jest.mock('aws-sdk/global', () => ({
	config: {
		update: jest.fn()
	}
}));

import AWS from 'aws-sdk/global';

test('init', async () => {
	await dynamoUtil.init('config' as any, true, 'process', () => 0, () => ({} as any));
	expect(dynamoUtil.ddb).toBeTruthy();
	expect(dynamoUtil.live).toBeTruthy();
	expect(dynamoUtil.process).toBe('process');
	expect((AWS.config.update as jest.Mock).mock.calls).toMatchSnapshot();
});

test('insertData no ddb', async () => {
	dynamoUtil.ddb = undefined;
	try {
		await dynamoUtil.insertData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('queryData no ddb', async () => {
	try {
		await dynamoUtil.queryData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('scanData no ddb', async () => {
	try {
		await dynamoUtil.scanData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('deleteData no ddb', async () => {
	try {
		await dynamoUtil.deleteData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('insertData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		putItem: mock
	} as any;
	try {
		await dynamoUtil.insertData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('queryData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		query: mock
	} as any;
	try {
		await dynamoUtil.queryData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('scanData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		scan: mock
	} as any;
	try {
		await dynamoUtil.scanData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('deleteData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		deleteItem: mock
	} as any;
	try {
		await dynamoUtil.deleteData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('insertData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		putItem: mock
	} as any;
	await dynamoUtil.insertData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('queryData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		query: mock
	} as any;
	await dynamoUtil.queryData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('scanData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		scan: mock
	} as any;
	await dynamoUtil.scanData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('deleteData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		deleteItem: mock
	} as any;
	await dynamoUtil.deleteData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('getPriceKeyField', () => {
	expect(dynamoUtil.getPriceKeyField(0)).toBe(CST.DB_SRC_DHM);
	expect(dynamoUtil.getPriceKeyField(1)).toBe(CST.DB_SRC_DH);
	expect(dynamoUtil.getPriceKeyField(60)).toBe(CST.DB_SRC_DATE);
	expect(() => dynamoUtil.getPriceKeyField(2)).toThrowErrorMatchingSnapshot();
});

const trade = {
	quote: 'quote',
	base: 'base',
	source: 'src',
	id: 'id',
	price: 123,
	amount: 456,
	timestamp: 1234567890
};

const events: IEvent[] = [
	{
		contractAddress: 'contractAddress',
		type: 'type',
		id: 'id',
		blockHash: 'blockHash',
		blockNumber: 123,
		transactionHash: 'txHash',
		logStatus: 'logStatus',
		parameters: {
			test: 'test'
		},
		timestamp: 1234567890
	},
	{
		contractAddress: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309',
		type: 'CommitPrice',
		id: 'id',
		blockHash: 'blockHash',
		blockNumber: 123,
		transactionHash: 'txHash',
		logStatus: 'logStatus',
		parameters: {
			sender: '0x00D8d0660b243452fC2f996A892D3083A903576F'
		},
		timestamp: 1234567890
	}
];

test('connection initalization', () =>
	dynamoUtil.insertData({} as any).catch(error => expect(error).toMatchSnapshot()));

test('convertTradeToDynamo', () =>
	expect(dynamoUtil.convertTradeToDynamo(trade, 123)).toMatchSnapshot());

test('convertEventToDynamo', () =>
	events.forEach(event =>
		expect(dynamoUtil.convertEventToDynamo(event, 9876543210)).toMatchSnapshot()
	));

test('insertTradeData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 0);
	await dynamoUtil.insertTradeData(trade, true);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('insertEventsData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.insertEventsData(events);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('insertHeartbeat', async () => {
	dynamoUtil.live = false;
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertHeartbeat();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertHeartbeat error', async () => {
	dynamoUtil.live = true;
	dynamoUtil.insertData = jest.fn(() => Promise.reject());
	await dynamoUtil.insertHeartbeat({});
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertStatusData', async () => {
	dynamoUtil.live = false;
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertStatusData({ test: 'test' });
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertStatusData error', async () => {
	dynamoUtil.live = true;
	dynamoUtil.insertData = jest.fn(() => Promise.reject());
	await dynamoUtil.insertStatusData({ test: 'test' });
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('scanStatus', async () => {
	dynamoUtil.scanData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.scanStatus();
	expect((dynamoUtil.scanData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.scanData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

const convertedStatus = dynamoUtil.parseStatus(status);
test('parseStatus', () => expect(convertedStatus).toMatchSnapshot());

test('queryAcceptPriceEvent', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryAcceptPriceEvent(CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('parseAcceptedPrices', () => expect(dynamoUtil.parseAcceptedPrice(prices)).toMatchSnapshot());

test('queryConversionEvent', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryConversionEvent(CST.DUMMY_ADDR, CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(4);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[2][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[3][0]).toMatchSnapshot();
});

test('parseConversion', () => expect(dynamoUtil.parseConversion(conversion)).toMatchSnapshot());

test('queryTotalSupplyEvent', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryTotalSupplyEvent(CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('parseTotalSupply', () => expect(dynamoUtil.parseTotalSupply(totalSupply)).toMatchSnapshot());

test('queryUIConversionEvent', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryUIConversionEvent(CST.DUMMY_ADDR, CST.DUMMY_ADDR);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('parseUIConversion', () => {
	expect(dynamoUtil.parseUIConversion(uiCreate)).toMatchSnapshot();
	expect(dynamoUtil.parseUIConversion(uiRedeem)).toMatchSnapshot();
});

test('getPrices', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);

	const start = moment.utc('20181007T235800').valueOf();
	const end = moment.utc('20181008T001000').valueOf();
	dynamoUtil.getSingleKeyPeriodPrices = jest.fn(() =>
		Promise.resolve([
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 220.10002,
				high: 220.10002,
				low: 220.10002,
				close: 220.10002,
				volume: 0.0007
			},
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 220.10002,
				high: 220.10002,
				low: 220.10002,
				close: 220.10002,
				volume: 17.6757
			},
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 202.12,
				high: 202.12,
				low: 202.12,
				close: 202.12,
				volume: 0.0013
			}
		])
	);
	await dynamoUtil.getPrices('anySrc', 1, start);
	await dynamoUtil.getPrices('anySrc', 1, start, end);
	await dynamoUtil.getPrices('anySrc', 1, start, end, 'ETH|USD');
	await dynamoUtil.getPrices('anySrc', 60, start, end);
	expect(
		(dynamoUtil.getSingleKeyPeriodPrices as jest.Mock<Promise<void>>).mock.calls
	).toMatchSnapshot();
});

const price = {
	source: 'source',
	base: 'base',
	quote: 'quote',
	timestamp: 1234567890,
	period: 1,
	open: 2,
	high: 4,
	low: 0,
	close: 3,
	volume: 5
};

test('addPrice', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.addPrice(price);
	price.period = 10;
	await dynamoUtil.addPrice(price);
	price.period = 60;
	await dynamoUtil.addPrice(price);
	price.period = 360;
	await dynamoUtil.addPrice(price);
	price.period = 1440;
	await dynamoUtil.addPrice(price);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertUIConversion', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	await dynamoUtil.insertUIConversion(
		CST.DUMMY_ADDR,
		CST.DUMMY_ADDR,
		'0x123',
		true,
		123,
		456,
		456,
		0.123
	);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('deleteUIConversionEvent', async () => {
	dynamoUtil.deleteData = jest.fn(() => Promise.resolve());
	await dynamoUtil.deleteUIConversionEvent(CST.DUMMY_ADDR, {
		contractAddress: 'contractAddress',
		type: 'type',
		transactionHash: 'txHash',
		eth: 0,
		tokenA: 0,
		tokenB: 0,
		timestamp: 0,
		blockNumber: 0,
		fee: 0
	});
	expect((dynamoUtil.deleteData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 9876543210);
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 0, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 0, 1234567890, 'quote|base');
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1, 1234567890, 'quote|base');
	await dynamoUtil.getSingleKeyPeriodPrices('src', 10, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 60, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 360, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1440, 1234567890);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});
