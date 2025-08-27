# Working with MicroFrontends

MicroFrontends are a common frontend pattern with evolving understanding. Nearly all MicroFrontend is implemented differently which presents a challenge for frontend telemetry data libraries. As of now, there is no magic solution that makes OpenTelemetry or HFO SDK work easily with all MicroFrontend systems. Tradeoffs and limitations are certain.

When adding observability it helps to understand your system and its observability needs. You should have a clear idea of what your MicroFrontend architecture actually looks like, what it’s limitations and capabilities are. While there are some emerging patterns with things like module federation, many MicroFrontends tend to be rather unique systems. Having a clear understanding of your own is key to anticipating and managing some of the risks when integrating observability into your MicroFrontend.

Second, you need to understand what sort of information you are observing and at what granularity. If you are primarily interested in page-level metrics you likely won’t encounter many of the issues with attributing to modules. In many systems this is desirable though. The intent of this article is not to be a recipe book but to provide a starting point and give you some ideas for how to manage some of the challenges for your MicroFrontend.


## MicroFrontend Implementations

In spite of the uniqueness of each MicroFrontend system, there are a few general patters and shapes that systems follow. Module federation for example is a new way of architecting MicroFrontends, but there are also methods that utilize a central bootstrap. Some even do both.

With module federation you are much more likely to encounter issues in library initialization but this is less of a problem with central bootstrap systems. Most MicroFrontend systems are likely to encounter some problems related to the SDK being a singleton.

###  Library initialization

Library initialization in OpenTelemetry/HFO must be done only once per page load. In a MicroFrontend architecture, this can be a problem if every module is attempting to initialize its own OpenTelemetry library. If your system allows, initialize the library in a central bootstrap or shared module and expose it to the other modules. Some Module Federation systems allow you to specify “singleton dependencies” for libraries like OpenTelemetry or react that require they be singletons on the page.

```
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      shared: {
        // adds HFO and OpenTelemetry as shared modules
        "@honeycombio/opentelemetry-web": {
          singleton: true,
        },
        "@opentelemetry/api": {
          singleton: true,
        }
      },
    }),
  ],
};

// HFO gets initialized (only do this in one module)
const sdk = new HoneycombWebSDK({
  apiKey: "your-honeycomb-api-key",
  serviceName: "hfo-micorfrontends",
  instrumentations: [getWebAutoInstrumentations()],
  localVisualizations: true,
});
```

The above example shows `webpack` with the ModuleFederation plugin. In this situation HFO will be initialized in your main module and you can use the OpenTelemitry API for custom instrumentation.

In other modules you can create traces and spans as you normally would.

```
import { trace } from '@opentelemetry/api';

//...
const tracer = trace.getTracer('OTel-MFO');
const span = tracer.startSpan('module-render');
span.setAttributes({'module': 'module-b'});

// render module
//...

span.end();
```

## Understanding your **Observability** Needs

What sort of challenges you face are going to depend a lot on what information you need visibility into and how granular you want to be with attributing things to modules. What metrics are done on a per-page basis and what ones should be granular enough to go down to the module, or even component level? Some metrics might be fine at a per-page level, but for many, such as error reporting, you will likely want to know what module the errors originated in.


### Custom Instrumentation

Writing your own code to handle instrumentation (instead of utilizing auto-instrumentation) is one possible method to avoid some of the pitfalls. If most of your telemetry will require custom instrumentation, it will be fairly easy for you to add attributes that can identify specific modules.


### Auto-instrumentation

When it comes to auto-instrumentation, many libraries will treat the entire app as a monolith. This can be fine if you are only concerned with page level granularity. For example, it might be reasonable to do web vitals on a page-level. When you need things to be more granular, especially at the module level, it become more challenging. With events like user clicks there is generally information provided about the event. You could use this information to determine the originating module.


```
class MFOSpanProcessor implements SpanProcessor {

  constructor(){
     super();
  }

  onStart(span: Span) {
    let moduleName = 'unknown-module';

    if(isModuleA()) {
        moduleName = 'module-a';
    }
    else if(isModuleB()) {
        moduleName = 'module-b';
    }
    else if(isMainModule()) {
        moduleName = 'module-main';
    }
    span.setAttributes({'module': moduleName});
  }

}

//...
const sdk = new HoneycombWebSDK({
  apiKey: "your-honeycomb-api-key",
  serviceName: "hfo-micorfrontends",
  instrumentations: [getWebAutoInstrumentations()],
  spanProcessors: [new MFOSpanProcessor()]
  localVisualizations: true,
});
```

Determining what module the span originates from will be heavily implementation dependent. Sometimes you can use preexisting attributes such as target element to determine origin.

Hopefully this provided a useful starting point for adding MicroFrontend. As this is still a fragmented space with many unique implementations your solution will be implementation specific.
