import { Client, TemplateMessage } from '@line/bot-sdk';
import CheckResult from './CheckResult';

export default class CheckDialog {
  public static readonly RESULT_CHAR: { [key: string]: CheckResult } = {
    '×': CheckResult.Bad,
    '△': CheckResult.Usual,
    '○': CheckResult.Good
  };

  constructor(
    private botClient: Client,
    private questionNumber: number,
    private questionText: string
  ) {}

  public async show(userId: string) {
    console.log(`${this.questionNumber} 問目 : ${this.questionText}`);
    // tslint:disable-next-line:object-literal-sort-keys
    const message: TemplateMessage = {
      altText: 'This is a buttons template',
      template: {
        actions: [
          {
            data: 'action=buy&itemid=123',
            label: 'Buy',
            type: 'postback',
          },
          {
            data: 'action=add&itemid=123',
            label: 'Add to cart',
            type: 'postback'
          },
          {
            label: 'View detail',
            type: 'uri',
            uri: 'http://example.com/page/123'
          }
        ],
        text: 'Please select',
        title: 'Menu',
        type: 'buttons'
      },
      type: 'template'
    };
    await this.botClient.pushMessage(userId, message);
  }
}
