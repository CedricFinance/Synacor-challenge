import * as readline from 'readline';

function init(inputs: number[] = [], sigintHandler = () => { return; }) {
  var sigintCounts = 0;

  var rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  rl.on('SIGINT', () => {
    sigintCounts++;
    if (sigintCounts == 2) {
      process.exit(0);
    }
    sigintHandler();
  })

  function question(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      rl.question(message, answer => resolve(answer));
    })
  }

  function readChar() {
    if (inputs.length == 0) {
      return question('?').then(answer => {
        inputs = [...answer,"\n"].map(str => str.charCodeAt(0));
        return inputs.shift()
      });
    }

    return Promise.resolve(inputs.shift());
  }

  return readChar;
}

module.exports = init;