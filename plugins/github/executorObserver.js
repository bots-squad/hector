require('shelljs/global');
const fs = require("fs");
const Observer = require(`../../core_observers/observers`).Observer;

let initialize = (broker) => {
  let executorObserver = new Observer(broker)

  /*
    # ciObserver
    gitObserver emits on `deployment`
  */
  executorObserver.on('deployment', (pushInformations) => {
    // ⚠️⚠️⚠️ never update on the production branch
    // see https://developer.github.com/v3/repos/deployments/#deployments
    // see https://developer.github.com/guides/delivering-deployments/
    exec(require(`../../${pushInformations.tmp_directory}/${pushInformations.repository_name}/hector-jobs.js`).deployment({}), (code, stdout, stderr) => {
      // 👋👋🐼 -> show the code in the repository
      executorObserver.emit('deployment_ok', pushInformations);
      /*
        # messages
        ciObserver listening on `deployment_ok`
      */
    });
    // TODO: KO case
    // TODO: check if hector-jobs.js
  });

  /*
    # ciObserver
    gitObserver emits on `integration`
  */
  executorObserver.on('integration', (pushInformations) => {
    exec(require(`../../${pushInformations.tmp_directory}/${pushInformations.repository_name}/hector-jobs.js`).integration({}), (code, stdout, stderr) => {

      switch (code) {
        case 0:

          fs.writeFile(`${pushInformations.tmp_directory}-stdout.log.txt`, stdout, (err) => {
             if (err) {
               executorObserver.emit(
                 "failure", {message: '😡 integration failure when log', from: "executorObserver"}
               );
             }
          });

          executorObserver.emit('integration_ok', pushInformations);
          /*
            # messages
            ciObserver listening on `integration_ok`
          */
          break;
        default:
          fs.writeFile(`${pushInformations.tmp_directory}-stderr.log`, stderr, (err) => {
            if (err) {
              executorObserver.emit(
                "failure", {message: '😡 integration failure when log', from: "executorObserver"}
              );
            }
          });

          fs.writeFile(`${pushInformations.tmp_directory}-stdout.log.txt`, stdout, (err) => {
            if (err) {
              executorObserver.emit(
                "failure", {message: '😡 integration failure when log', from: "executorObserver"}
              );
            }
          });

          executorObserver.emit('integration_ko', pushInformations);
          /*
            # messages
            ciObserver listening on `integration_ko`
          */

      } // end of switch

      // remove directory
      exec(`rm -rf ${pushInformations.tmp_directory}`)

    }) // end of exec

    // TODO: check if hector-jobs.js
  });


  return executorObserver;
}

module.exports = {
  initialize: initialize
};
