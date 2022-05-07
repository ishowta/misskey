process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { Note } from '@/models/entities/note.js';
import { Antenna } from '@/models/entities/antenna.js';
import { User } from '@/models/entities/user.js';
import {
	async,
	signup,
	request,
	startServer,
	shutdownServer,
} from '../utils.js';
import config from '@/config/index.js';

describe('Antennas', () => {
	let p: childProcess.ChildProcess;

	let alice: User;
	let bob: User;

	before(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	});

	after(async () => {
		await shutdownServer(p);
	});

	it('アンテナがノートの投稿を検知できる', async(async () => {
		let res;

		res = await request(
			'/antennas/create',
			{
				name: 'Test Antenna',
				src: 'all',
				keywords: [['Hello']],
				excludeKeywords: [[]],
				users: [],
				caseSensitive: false,
				withReplies: true, // = allow
				withFile: false, // = not required
				notify: false,
			},
			alice,
		);

		assert.strictEqual(res.status, 200);

		const helloAntenna = res.body as Antenna;

		res = await request('/notes/create', { text: 'Hello world!' }, bob);

		assert.strictEqual(res.status, 200);

		const helloWorldNote = res.body.createdNote as Note;

		res = await request(
			'/antennas/notes',
			{ antennaId: helloAntenna.id },
			alice,
		);

		assert.strictEqual(res.status, 200);

		const helloAntennaNotes = res.body as Note[];

		assert.strictEqual(helloAntennaNotes.length, 1);
		assert.strictEqual(helloAntennaNotes[0].id, helloWorldNote.id);
	}));

	it('キーワードにホストを指定できる', async(async () => {
		let res;

		const exampleMan = await signup({
			username: 'exampleMan',
			host: 'example.com',
		});

		res = await request(
			'/antennas/create',
			{
				name: 'notes from local',
				src: 'all',
				keywords: [[`host:${config.host}`]],
				excludeKeywords: [[]],
				users: [],
				caseSensitive: false,
				withReplies: true, // = allow
				withFile: false, // = not required
				notify: false,
			},
			alice,
		);

		assert.strictEqual(res.status, 200);

		const localAntenna = res.body as Antenna;

		res = await request(
			'/antennas/create',
			{
				name: 'notes from example.com',
				src: 'all',
				keywords: [['host:example.com']],
				excludeKeywords: [[]],
				users: [],
				caseSensitive: false,
				withReplies: true, // = allow
				withFile: false, // = not required
				notify: false,
			},
			alice,
		);

		assert.strictEqual(res.status, 200);

		const exampleComAntenna = res.body as Antenna;

		res = await request('/notes/create', { text: 'Hello' }, bob);

		assert.strictEqual(res.status, 200);

		const noteFromLocal = res.body.createdNote as Note;

		res = await request('/notes/create', { text: 'Hello' }, exampleMan);

		assert.strictEqual(res.status, 200);

		const noteFromExampleCom = res.body.createdNote as Note;

		res = await request(
			'/antennas/notes',
			{ antennaId: localAntenna.id },
			alice,
		);

		assert.strictEqual(res.status, 200);

		const localAntennaNotes = res.body as Note[];

		res = await request(
			'/antennas/notes',
			{ antennaId: exampleComAntenna.id },
			alice,
		);

		assert.strictEqual(res.status, 200);

		const exampleComAntennaNotes = res.body as Note[];

		assert.strictEqual(localAntennaNotes.length, 1);
		assert.strictEqual(localAntennaNotes[0].id, noteFromLocal.id);
		assert.strictEqual(exampleComAntennaNotes.length, 1);
		assert.strictEqual(exampleComAntennaNotes[0].id, noteFromExampleCom.id);
	}));
});
