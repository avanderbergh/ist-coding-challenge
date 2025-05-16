import { Configuration } from "../models/ConfigurationModel";

export default class DummyController {
  configuration: Configuration;

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }

  async dummyFunction(dummyValue: boolean): Promise<boolean> {
    this.dummyFunction.toString();
    return dummyValue;
  }
}
