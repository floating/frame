
const { Resolver } = require("@parcel/plugin");

const reactDom = "react-dom";
const schedulerTracing = "scheduler/tracing";

function shouldProfile(specifier) {
    return (
      process.env.REACT_PROFILING !== undefined &&
      (specifier === reactDom || specifier === schedulerTracing)
    );
  }

module.exports = new Resolver({
  async resolve({specifier}) {
    if (shouldProfile(specifier) && specifier === 'react-dom') {
      return {
        filePath: require.resolve('react-dom/profiling') // path.join(__dirname, "..", "node_modules/react-dom/profiling.js")
      };
    } else if (shouldProfile(specifier)) {
        return {
          filePath: require.resolve('scheduler/tracing-profiling')// path.join(__dirname, "..", "node_modules/scheduler/tracing-profiling.js")
        };
      }

    // Let the next resolver in the pipeline handle 
    // this dependency.
    return null;
  }
});
