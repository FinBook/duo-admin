import { kovan } from '../../../duo-contract-wrapper/src/contractAddresses';
import dbUtil from '../utils/dbUtil';
import eventUtil from '../utils/eventUtil';
import keyUtil from '../utils/keyUtil';
import priceUtil from '../utils/priceUtil';
import ContractService from './ContractService';

jest.mock('../../../duo-contract-wrapper/src/Web3Wrapper', () =>
	jest.fn(() => ({
		web3: {
			eth: {
				accounts: {
					privateKeyToAccount: jest.fn(() => ({ address: '0xpublicKey' }))
				}
			}
		},
		contractAddresses: kovan
	}))
);

jest.mock('../../../duo-contract-wrapper/src/DualClassWrapper', () =>
	jest.fn(() => ({
		contract: 'dualClassWrapper'
	}))
);
jest.mock('../../../duo-contract-wrapper/src/EsplanadeWrapper', () =>
	jest.fn(() => ({
		contract: 'EsplanadeWrapper'
	}))
);
jest.mock('../../../duo-contract-wrapper/src/MagiWrapper', () =>
	jest.fn(() => ({
		contract: 'MagiWrapper'
	}))
);

const contractService = new ContractService('tool', {
	live: false,
	provider: 'provider',
	event: 'event',
	gasPrice: 1000000000,
	pair: 'quote|base',
	force: false,
	contractType: 'type',
	tenor: 'tenor'
} as any);

test('fetchKey', async () => {
	keyUtil.getKey = jest.fn(() =>
		Promise.resolve({
			privateKey: '0xprivateKey'
		})
	);
	await contractService.fetchKey();
	expect(contractService.key).toMatchSnapshot();
	expect(contractService.address).toMatchSnapshot();
});

test('fetchKey, key not start with 0x', async () => {
	keyUtil.getKey = jest.fn(() =>
		Promise.resolve({
			privateKey: 'privateKey'
		})
	);
	await contractService.fetchKey();
	expect(contractService.key).toMatchSnapshot();
	expect(contractService.address).toMatchSnapshot();
});

test('trigger', async () => {
	contractService.fetchKey = jest.fn();
	eventUtil.trigger = jest.fn();
	await contractService.trigger();
	expect((eventUtil.trigger as jest.Mock).mock.calls).toMatchSnapshot();
});

test('commitPrice', async () => {
	contractService.fetchKey = jest.fn();
	dbUtil.init = jest.fn();
	dbUtil.insertHeartbeat = jest.fn();
	priceUtil.startCommitPrices = jest.fn();
	global.setInterval = jest.fn();

	await contractService.commitPrice();
	(global.setInterval as jest.Mock).mock.calls[0][0]();
	expect((dbUtil.init as jest.Mock).mock.calls).toMatchSnapshot();
	expect((priceUtil.startCommitPrices as jest.Mock).mock.calls).toMatchSnapshot();
});

test('fetchPrice', async () => {
	contractService.fetchKey = jest.fn();
	dbUtil.init = jest.fn();
	dbUtil.insertHeartbeat = jest.fn();
	priceUtil.fetchPrice = jest.fn();
	global.setInterval = jest.fn();

	await contractService.fetchPrice();
	(global.setInterval as jest.Mock).mock.calls[0][0]();
	expect((dbUtil.init as jest.Mock).mock.calls).toMatchSnapshot();
	expect((priceUtil.fetchPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startCustodian, worng type', async () => {
	contractService.createDuoWrappers = jest.fn();
	await contractService.startCustodian('account');
	expect(contractService.createDuoWrappers as jest.Mock).not.toBeCalled();
});

test('fetchEvent', async () => {
	eventUtil.fetch = jest.fn();
	contractService.createDuoWrappers = jest.fn(() => ({
		Beethoven: {
			Perpetual: 'BTV-PPT',
			M19: 'BTV-M19'
		},
		Mozart: {
			Perpetual: 'MZT-PPT',
			M19: 'MZT-M19'
		}
	}));
	await contractService.fetchEvent();
	expect((eventUtil.fetch as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startCustodian', async () => {
	const contractService1 = new ContractService('tool', {
		live: false,
		provider: 'provider',
		event: 'event',
		gasPrice: 1000000000,
		gasLimit: 10000,
		pair: 'quote|base',
		contractType: 'Beethoven',
		tenor: 'Perpetual'
	} as any);
	const startCustodian = jest.fn();

	contractService1.createDuoWrappers = jest.fn(() => ({
		Beethoven: {
			Perpetual: {
				startCustodian: startCustodian,
				web3Wrapper: {
					contractAddresses: kovan
				}
			}
		}
	}));
	await contractService1.startCustodian('account');
	expect((startCustodian as jest.Mock).mock.calls).toMatchSnapshot();
});