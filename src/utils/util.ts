import moment from 'moment';
import * as CST from '../common/constants';
import { IOption } from '../common/types';
import infura from '../keys/infura.json';
// import { Options } from 'aws-cli-js';

class Util {
	public logLevel: string = CST.LOG_INFO;

	private log(text: any, level?: string): void {
		if (level && CST.LOG_RANKING[this.logLevel] >= CST.LOG_RANKING[level])
			console.log(`${moment().format('HH:mm:ss.SSS')} [${level}]: ` + text);
		else console.log(`${moment().format('HH:mm:ss.SSS')} : ` + text);
	}

	public logInfo(text: any): void {
		this.log(text, CST.LOG_INFO);
	}

	public logDebug(text: any): void {
		this.log(text, CST.LOG_DEBUG);
	}

	public logError(text: any): void {
		this.log(text, CST.LOG_ERROR);
	}

	public composeQuery(paras: { [key: string]: any }): string {
		let query: string = '?';
		for (const key in paras) query += key + '=' + paras[key] + '&';
		query = query.slice(0, -1);
		return query;
	}

	public parseOptions(argv: string[]): IOption {
		const option = {
			forceREST: argv.includes('rest'),
			live: process.argv.includes('live'),
			dbLive: process.argv.includes('dbLive'),
			server: process.argv.includes('server'),
			dynamo: process.argv.includes('dynamo'),
			aws: process.argv.includes('aws'),
			gcp: process.argv.includes('gcp'),
			azure: process.argv.includes('azure'),
			force: process.argv.includes('force'),
			pair: 'ETH|USD',
			assets: [''],
			sources: [''],
			exSources: [''],
			gasPrice: 5e9,
			gasLimit: 200000,
			eth: 0,
			address: '',
			addr1: '',
			addr2: '',
			privateKey: '',
			price: 0,
			source: '',
			pwd: '',
			event: '',
			provider: '',
			contractState: '',
			accountNum: 1,
			saveAccount: false,
			from: '',
			to: '',
			value: 0,
			index: 0,
			total: 10,
			minEther: 0.02,
			alpha: 0.3,
			amtA: 0,
			amtB: 0,
			numOfMinutes: 2,
			numOfHours: 2,
			key: '',
			period: 1,
			endBlk: 0,
			base: 'USD',
			quote: 'ETH'
		};
		for (let i = 3; i < argv.length; i++) {
			const args = argv[i].split('=');
			switch (args[0]) {
				case 'exSources':
					option.exSources = args[1].split(',');
					break;
				case 'sources':
					option.sources = args[1].split(',');
					break;
				case 'pair':
					option.pair = args[1].replace('_', '|') || option.pair;
					break;
				case 'assets':
					option.assets = args[1].split(',');
					break;
				case 'gasPrice':
					option.gasPrice = Number(args[1]) || option.gasPrice;
					break;
				case 'gasLimit':
					option.gasLimit = Number(args[1]) || option.gasLimit;
					break;
				case 'eth':
					option.eth = Number(args[1]) || option.eth;
					break;
				case 'address':
					option.address = args[1] || option.address;
					break;
				case 'addr1':
					option.addr1 = args[1] || option.addr1;
					break;
				case 'addr2':
					option.addr2 = args[1] || option.addr2;
					break;
				case 'privateKey':
					option.privateKey = args[1] || option.privateKey;
					break;
				case 'price':
					option.price = Number(args[1]) || option.price;
					break;
				case 'pwd':
					option.pwd = args[1] || option.pwd;
					break;
				case 'source':
					option.source = args[1] || option.source;
					break;
				case 'event':
					option.event = args[1] || option.event;
					break;
				case 'provider':
					option.provider = args[1] || option.provider;
					break;
				case 'contractState':
					option.contractState = args[1] || option.contractState;
					break;
				case 'accountNum':
					option.accountNum = Number(args[1]) || option.accountNum;
					break;
				case 'saveAccount':
					option.saveAccount = args[1] === 'yes' || option.saveAccount;
					break;
				case 'from':
					option.from = args[1] || option.from;
					break;
				case 'total':
					option.total = Number(args[1]) || option.total;
					break;
				case 'minEther':
					option.minEther = Number(args[1]) || option.minEther;
					break;
				case 'alpha':
					option.alpha = Number(args[1]) || option.alpha;
					break;
				case 'amtA':
					option.amtA = Number(args[1]) || option.amtA;
					break;
				case 'amtB':
					option.amtB = Number(args[1]) || option.amtB;
					break;
				case 'value':
					option.value = Number(args[1]) || option.value;
					break;
				case 'index':
					option.index = Number(args[1]) || option.index;
					break;
				case 'numOfMinutes':
					option.numOfMinutes = Number(args[1]) || option.numOfMinutes;
					break;
				case 'numOfHours':
					option.numOfHours = Number(args[1]) || option.numOfHours;
					break;
				case 'key':
					option.key = args[1] || option.key;
					break;
				case 'endBlk':
					option.endBlk = Number(args[1]) || option.endBlk;
					break;
				case 'period':
					option.period = Number(args[1]);
					break;
				case 'base':
					option.base = args[1] || option.base;
					break;
				case 'quote':
					option.quote = args[1] || option.quote;
					break;
				default:
					break;
			}
		}

		if (!option.provider)
			if (option.source === CST.SRC_MYETHER)
				option.provider = option.live
					? CST.PROVIDER_MYETHER_MAIN
					: CST.PROVIDER_INFURA_KOVAN + '/' + infura.token;
			else if (option.source === CST.SRC_INFURA)
				option.provider =
					(option.live ? CST.PROVIDER_INFURA_MAIN : CST.PROVIDER_INFURA_KOVAN) +
					'/' +
					infura.token;
			else option.provider = CST.PROVIDER_LOCAL_WS;
		// option.provider = '';

		return option;
	}

	public getPeriodStartTimestamp(timestamp: number, period: number = 1) {
		// const now = this.getUTCNowTimestamp();
		return Math.floor(timestamp / 60000 / period - 1) * 60000 * period;
	}

	public timestampToString(ts: number) {
		//just for debugging purpose
		return moment.utc(ts).format('YYYY-MM-DDTHH:mm:ss');
	}

	public getDynamoRole(option: IOption, tool: string, useDynamo: boolean): string {
		switch (tool) {
			case CST.TRADES:
				return useDynamo ? CST.AWS_DYNAMO_ROLE_TRADE : CST.AWS_DYNAMO_ROLE_STATUS;
			case CST.COMMIT:
			case CST.CLEAN_DB:
			case CST.NODE:
				// case 'getKey':
				// case 'getSqlAuth':
				return CST.AWS_DYNAMO_ROLE_STATUS;
			case CST.SUBSCRIBE:
				return CST.AWS_DYNAMO_ROLE_EVENT;
			case CST.DB_PRICES:
				if (option.period === 1) return CST.AWS_DYNAMO_ROLE_MINUTELY;
				else if (option.period === 60) return CST.AWS_DYNAMO_ROLE_HOURLY;
				else return '';
			default:
				return '';
		}
	}

	public getStatusProcess(tool: string, option: IOption) {
		let type = '';
		const platform = option.azure ? '_AZURE' : option.gcp ? '_GCP' : '_AWS';
		console.log('dynamo', option.dynamo);
		const privacy = option.dynamo ? '_PUBLIC' : '_PRIVATE';
		let source = '';

		switch (tool) {
			case CST.TRADES:
				type = 'TRADE';
				source = option.source ? '_' + option.source.toUpperCase() : '';
				break;
			case CST.SUBSCRIBE:
				type = 'EVENT';
				source =
					'_' +
					([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event)
						? option.event.toUpperCase()
						: 'OTHERS');
				break;
			case CST.COMMIT:
				type = 'FEED';
				break;
			case CST.CLEAN_DB:
				type = 'CLEANDB';
				break;
			case CST.DB_PRICES:
				type = 'PRICE';
				if (option.period === 0) source = '_MINUTELY';
				else if (option.period === 60) source = '_HOURLY';
				else source = '';
				break;
			// case 'minutely':
			// 	type = 'MINUTELY';
			// 	break;
			case CST.NODE:
				type = 'CHAIN';
				break;
			default:
				return '';
		}

		return type + platform + privacy + source;
	}

	public getUTCNowTimestamp() {
		return moment().valueOf();
	}

	public isNumber(input: any): boolean {
		const num = Number(input);
		return isFinite(num) && !isNaN(num);
	}

	public isEmptyObject(obj: object | undefined | null): boolean {
		if (!obj) return true;

		for (const prop in obj) if (obj.hasOwnProperty(prop)) return false;

		return true;
	}

	public async sleep(ms: number) {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}
}

const util = new Util();
export default util;