import Quiz, { QType } from './Quiz';

export default class Kani implements QType {
    type: string = 'Kani';
    private index: number = 0;
    private readonly quizzes: Quiz[] = [
        new Quiz(1, '越前がには一年中とってよい', false)
    ];

    hasNext(): boolean {
        return this.quizzes.length - 1 === this.index;
    }

    next(): Quiz {
        return this.quizzes[this.index];
    }
}