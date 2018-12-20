import Provider from './quiz/Provider';
import Quiz from './quiz/Quiz';
import Kani from './quiz/Kani';
import Express, { Request, Response } from 'express';
import CheckListInterlocutor from './checklist/CheckListInterlocutor';
import {
    Client, middleware, ClientConfig, MiddlewareConfig,
    MessageEvent,
    TextEventMessage, TextMessage, PostbackEvent,
    FlexMessage, FlexBubble, FlexBox, FlexImage, FlexText,
} from '@line/bot-sdk';

/**
 * アプリ全体のTODO
 * ProcfileをREADMEに書く。
 * 最後のクイズであることを知らせる。
 * クイズが最後までいったら、クイズを初期化する。
 * ボットが動いている様子を録画する。
 * lint対応
 * 複数ユーザーでテスト
   クイズの問題が全ユーザーで共有されているかもしれない。
   userIdとcurrentQuizのマッピングが必要（？）
 * 点数（正解だったクイズ）を表示する。
　 まずは全問回答する、という前提で。
　 スキップ（次のクイズ）が押される考慮
 */

// TODO 環境変数か、.envファイルで指定したい。
const clientConfig: ClientConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
};
const middlewareConfig: MiddlewareConfig = {
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const botClient = new Client(clientConfig);
const botMiddleware = middleware(middlewareConfig);

const app = Express();

const CMD_MARU = 'まる！';
const CMD_BATSU = 'ばつ！';
const CMD_RESTART = 'restart';
const CMD_DETAIL = 'detail';
const CMD_NEXT = 'next';
const quizProvider: Provider = new Kani();
let currentQuiz: Quiz = quizProvider.next();

const checklist: CheckListInterlocutor = new CheckListInterlocutor(botClient);

// 不要なコントローラー（サーバー起動の動作確認のため、だった気がする）
app.get('/', (request: Request, response: Response) => {
    return response.send('Hello mahaker!!');
});

app.post('/webhook', botMiddleware, (request: Request, response: Response) => {
    Promise
        .all(request.body.events.map(handleEvent))
        .then((result) => response.json(result))
        .catch((err) => {
            console.error(err);
            response.status(500).end();
        });
});

function handleEvent(event: MessageEvent | PostbackEvent) {
    const userId: string | undefined = event.source.userId;
    if (!userId) {
        return;
    }

    if (event.type === 'postback') {
        console.log('postback');

        const postback = event.postback;
        console.log('postback.data の内容:' + postback.data);

        // handleRichMenuAction(event);
    } else if (event.type === 'message') {
        const _event: MessageEvent = event as MessageEvent;
        const _textEventMessage: TextEventMessage = _event.message as TextEventMessage;

        if (_textEventMessage.text === 'クイズ') {
            pushQuiz(userId);
        } else if (_textEventMessage.text === 'チェックリスト') {
            pushChecklist(_event);
        } else {
            replayChecklist(_event, _textEventMessage.text);
        }
    }
}

// リッチメニュー上からのアクション
async function handleRichMenuAction(event: PostbackEvent) {
    const userId: string | undefined = event.source.userId;
    const data = JSON.parse(event.postback.data);

    if (!userId) {
        return;
    }

    if (data.cmd === 'answer') {
        if (currentQuiz.isCorrect(data.answer)) {
            // 正解なら次の問題を送信
            await botClient.pushMessage(userId, buildText('せいかい！'));
            currentQuiz = quizProvider.hasNext() ? quizProvider.next() : currentQuiz;
            pushQuiz(userId);
        } else {
            // 不正解なら今の問題を送信
            await botClient.pushMessage(userId, buildText('はずれ！'));
            pushQuiz(userId);
        }
    } else if (data.cmd === 'ctrl') {
        switch (data.action) {
            case (CMD_RESTART):
                quizProvider.init();
                currentQuiz = quizProvider.next();
                pushQuiz(userId);
                break;
            case (CMD_DETAIL):
                await botClient.pushMessage(userId, buildText(currentQuiz.getDetail()));
                break;
            case (CMD_NEXT):
                currentQuiz = quizProvider.hasNext() ? quizProvider.next() : currentQuiz;
                pushQuiz(userId);
                break;
        }
    }
}

// 睡眠クイズを返す。
async function pushQuiz(userId: string | undefined) {
    if (!userId) {
        return;
    }
    await botClient.pushMessage(userId, buildQuizForm(currentQuiz));
}

// チェックリストを返す。
async function pushChecklist(event: MessageEvent) {
    const userId: string | undefined = event.source.userId;
    if (!userId) return;
    console.log('checklist start');
    checklist.start(userId);
}

// チェックリストの返答なら処理する。
async function replayChecklist(event: MessageEvent, text: string) {
    const userId: string | undefined = event.source.userId;
    if (!userId) return;
    console.log('checklist replay');
    checklist.reply(userId, text);
}

// テキストメッセージを返す。最大2000文字
function buildText(t: string): TextMessage {
    return {
        type: 'text',
        text: t,
    };
}

function buildQuizForm(q: Quiz): FlexMessage {
    const flexHeaderContents: FlexText = {
        type: 'text',
        text: `問題${q.getNo()}`,
        size: 'lg',
        align: 'center',
        weight: 'bold',
    };
    const flexHeader: FlexBox = {
        type: 'box',
        layout: 'horizontal',
        contents: [flexHeaderContents],
    };
    const flexHero: FlexImage = {
        type: 'image',
        url: q.getImageUrl(),
    };
    const flexBodyContents: FlexText = {
        type: 'text',
        text: q.getText(),
        size: 'md',
        align: 'start',
        wrap: true,
    };
    const flexBody: FlexBox = {
        type: 'box',
        layout: 'horizontal',
        spacing: 'md',
        contents: [flexBodyContents],
    };
    const flexContents: FlexBubble = {
        type: 'bubble',
        direction: 'ltr',
        header: flexHeader,
        hero: flexHero,
        body: flexBody,
    };
    const message: FlexMessage = {
        type: 'flex',
        altText: 'Flex message',
        contents: flexContents,
    };
    return message;
}

export default app;
