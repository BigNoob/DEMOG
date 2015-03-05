/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name : ['DEMOG'],
  /**
   * Your New Relic license key.
   */
  license_key : 'f6f061202b5b6a5d13761db884bfd0bbcdbf0cf9',
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'info'
  },
  rules : {
      ignore : [
        '^/socket.io/.*/xhr-polling'
      ]
  }
};
