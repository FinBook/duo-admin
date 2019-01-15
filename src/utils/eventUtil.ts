import BaseContractWrapper from '../../../duo-contract-wrapper/src/BaseContractWrapper';
import DualClassWrapper from '../../../duo-contract-wrapper/src/DualClassWrapper';
import Web3Wrapper from '../../../duo-contract-wrapper/src/Web3Wrapper';
import * as CST from '../common/constants';
import { IEvent, IOption } from '../common/types';
import dynamoUtil from './dynamoUtil';
import util from './util';

class EventUtil {
	public async trigger(
		// account: string,
		dualClassWrappers: DualClassWrapper[],
		option: IOption
	) {
		util.logInfo('subscribing to ' + option.event);
		if (![CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event)) {
			util.logError('invalid event, exit');
			return Promise.resolve();
		}

		if (option.source)
			setInterval(async () => {
				const promiseList = dualClassWrappers.map(async dcw => {
					const sysState = await dcw.getStates();
					const state = sysState.state;
					util.logDebug('current state is ' + state + ' for ' + dcw.address);

					if (option.event === CST.EVENT_START_PRE_RESET && state === CST.CTD_PRERESET)
						await dcw.triggerPreReset('');
					else if (option.event === CST.EVENT_START_RESET && state === CST.CTD_RESET)
						await dcw.triggerReset('');

					dynamoUtil.insertHeartbeat();
				});
				await Promise.all(promiseList);
			}, 15000);
		else {
			for (const dcw of dualClassWrappers) {
				util.logInfo('starting listening ' + option.event + ' for ' + dcw.address);
				let tg: () => Promise<any> = () => Promise.resolve();
				const sysState = await dcw.getStates();
				const state = sysState.state;
				util.logInfo('current state is ' + state + ' for ' + dcw.address);

				if (option.event === CST.EVENT_START_PRE_RESET) {
					tg = () => dcw.triggerPreReset('');
					if (state === CST.CTD_PRERESET) await tg();
				} else if (option.event === CST.EVENT_START_RESET) {
					tg = () => dcw.triggerReset('');
					if (state === CST.CTD_RESET) await tg();
				}

				dcw.contract.events[option.event]({}, async (error, evt) => {
					if (error) util.logInfo(error);
					else {
						util.logInfo(evt);
						await tg();
					}
				});
			}

			setInterval(() => dynamoUtil.insertHeartbeat(), 30000);
		}
	}

	public async fetch(BaseContractWrappers: BaseContractWrapper[], force: boolean) {
		util.logInfo('fetching events');

		const web3Wrapper = BaseContractWrappers[0].web3Wrapper;

		let startBlk = force
			? web3Wrapper.inceptionBlockNumber
			: Math.max(await dynamoUtil.readLastBlock(), web3Wrapper.inceptionBlockNumber);
		util.logInfo('starting blk number: ' + startBlk);
		let isProcessing = false;
		const fetch = async () => {
			if (isProcessing) return;

			isProcessing = true;
			const blockTimestampMap: { [blk: number]: number } = {};
			const currentBlk = await web3Wrapper.getCurrentBlockNumber();
			while (startBlk <= currentBlk) {
				const allEvents: IEvent[] = [];
				const end = Math.min(startBlk + CST.EVENT_FETCH_BLOCK_INTERVAL, currentBlk);
				const promiseList: Array<Promise<any>> = [];
				BaseContractWrappers.forEach(bw =>
					bw.events.forEach(event =>
						promiseList.push(Web3Wrapper.pullEvents(bw.contract, startBlk, end, event))
					)
				);

				const results = await Promise.all(promiseList);
				for (const result of results)
					for (const el of result) {
						const blockTimestamp =
							blockTimestampMap[el.blockNumber] ||
							(await web3Wrapper.getBlockTimestamp(el.blockNumber));
						blockTimestampMap[el.blockNumber] = blockTimestamp;
						allEvents.push(Web3Wrapper.parseEvent(el, blockTimestamp));
					}

				util.logInfo(
					'total ' + allEvents.length + ' events from block ' + startBlk + ' to ' + end
				);
				if (allEvents.length > 0) await dynamoUtil.insertEventsData(allEvents);
				await dynamoUtil.insertHeartbeat({
					[CST.DB_ST_BLOCK]: { N: end + '' }
				});
				startBlk = end + 1;
			}
			isProcessing = false;
		};
		fetch();
		setInterval(() => fetch(), CST.EVENT_FETCH_TIME_INVERVAL);
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
