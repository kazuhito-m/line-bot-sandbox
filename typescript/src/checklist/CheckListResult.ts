import CheckResult from './CheckResult';

export default class CheckListResult {
  private readonly results: CheckResult[] = [];

  constructor(private userId: string) {}

  public nowNumber(): number {
    return this.results.length + 1;
  }

  public recordResult(result: CheckResult) {
    this.results[this.nowNumber() - 1] = result;
  }
}