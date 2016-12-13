require('shelljs/global');
const uuid = require('uuid');
const Observer = require(`../../core_observers/observers`).Observer;

let initialize = (broker) => {
  let gitObserver = new Observer(broker)

  /*
    # messages
    ciObserver emits on `clone_and_checkout`
  */
  gitObserver.on('clone_and_checkout', (informations) => {

    let random_path = uuid.v4();
    let tmp_directory = `clones/${random_path}`;

    // prepare a list of commands to execute
    let cmd = [
        `mkdir ${tmp_directory}; `
      , `cd ${tmp_directory}; `
      , `git clone ${informations.repository_url}; `
      , `cd ${informations.repository_name}; `
      , `git checkout ${informations.branch}; `
    ].join('');

    informations.random_path = random_path;
    informations.tmp_directory = tmp_directory;

    // === Execute the commands list ===
    // see http://bencane.com/2014/09/02/understanding-exit-codes-and-how-to-use-them-in-bash-scripts/
    // On Unix and Linux systems, programs can pass a value to their parent process while terminating.
    // This value is referred to as an exit code or exit status.
    // On POSIX systems the standard convention is for the program
    // - to pass 0 for successful executions
    // - and 1 or higher for failed executions.
    exec(cmd, (code, stdout, stderr) => {
      switch (code) {
        case 0: // 🍾 🍻 ✨ ☀️ repository "mounted"
          gitObserver.emit('clone_and_checkout_ok', informations)
          /*
            # messages
            ciObserver listening on `clone_and_checkout_ok`
          */
          break;
        default: // Ouch 🔥 💥 ⚡️ repository not "mounted"
          gitObserver.emit('clone_and_checkout_ko', informations)
          /*
            # messages
            ciObserver listening on `clone_and_checkout_ko`
          */
      }
    });
  });

  return gitObserver;
}

module.exports = {
  initialize: initialize
};
