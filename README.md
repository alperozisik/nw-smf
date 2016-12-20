
     ____                       _    __                      _       
    / ___| _ __ ___   __ _ _ __| |_ / _| __ _  ___ ___      (_) ___  
    \___ \| '_ ` _ \ / _` | '__| __| |_ / _` |/ __/ _ \     | |/ _ \ 
     ___) | | | | | | (_| | |  | |_|  _| (_| | (_|  __/  _  | | (_) |
    |____/|_| |_| |_|\__,_|_|   \__|_|  \__,_|\___\___| (_) |_|\___/ 
    -----------------------------------------------------------------


# NW
This library is intended to ease network (rest-http) connections easly.
First it is developed for [Smartface](https://www.smartface.io) then it is adopted to work both with node.

# Install
```shell
npm i smf-nw
```
## Smartface
If you are within a Smartface workspace first switch to scripts folder. Here is a script that does it all:
```shell
(cd ~/workspace/scripts && npm i smf-nw)
```

# Examples
Examples are not included within the npm package.
It is possible to reach examples from github page:
https://github.com/smartface/js-lib-nw/

# Usage
**nw** relies on **XMLHttpRequest** object to be global.
In _Smartface_ environment it is global. Following code in node makes it global:
```javascript
if (!global.XMLHttpRequest)
    global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
```
Make sure that **xmlhttprequest** module is installed
```shell
npm i xmlhttprequest
```

```javascript
const nw = require("nw"); //access to nw settings object
```

In order to make a call, first you need to register a service definition.
```javascript
nw.registerService(serviceDefinitionObject);
```

## Service Definition
Service Definition Object is a simple object. Members of the object are defined below:
- **name**: String, required. Name of the service. This is the unique accessor to the service.
- **method**: String, required. HTTP method of the service. Better to be all in capital letters.
- **path**: String, required; not required if url is used. Path is concatenated to end of the **nw.baseURL**. Supports string format. Do not define query string values here, so do not use question mark (?)
- **url**: String, required; not required if path is used. Full URL of the string, is not related with _nw.baseURL_. Supports string format.
- **mock**: Object, optional. Mock value of the service. Can have _body_, _header_, _status_.
- **header**: Object, optional. Key-value pair object. Static header parameters of the request.
- **query**: Object, optional. Key-value pair object. Static query string parameters of the request.
- **body**: Object or String, optional. Static body value of the request.

### String format
String format basically is a pattern in the given string and replacing those parameters within the string with given arguments.
More details can be reached from: https://www.npmjs.com/package/form-urlencoded

### Practical way to add services
Place them in a separate JSON files (with **json** extension) and require them.
Pass the require result into `nw.registerService(require("myServiceDefinitionFile.json"));`

# API
## nw settings
_nw_ settings object provides following API
### baseURL
String. Works kind a prefix to path. It does not add slashes (/) automatically while concatenating with path to form the URL of the service.
### services
Object. All service definitions are placed here. All services are registered with their names and can be accessed through by its name as property. A service definition with same name overwrites the definition.
### factory
Function. Creates **nw service object** from service definition. Service is given as parameter by name of the registered services. Does not expect a service definition as object.
### commonHeaders
Object. In key-value format. Adds header values to all requests. Useful to modify after login and logout. Also useful if all sevices _content-type_ and/or _accept_ values are same.
### registerService
Function. Takes a service definition object as parameter. After small validation it adds it to _services_ as a property.
### proxy
String. Smartface only! All requests are gone through a socks proxy in provided url value of the proxy server.
### ignoreSSLErrors
Boolean. Smartface only! Ignores SSL errors on services
### requestSuccessValidator
Function. A pre-processor for defining response  of the service falls into category of faulty or success based on the _http status_ of the response. Takes status (number) as argument parameter, returns true|false boolean as result. False mean faulty response. By default this is set all status between 200 & 399 are valid, rest not. Can be replaced with assigning this function with another.
### onActivityStart
Function|Event. Fired before network operation starts. Useful to block UI during network operation. Can be set by assigning the function. Does not takes any argument or returns.
### onActivityEnd
Function|Event. Fired after network operation starts. Useful to remove UI block after network operation completes. Can be set by assigning the function. Does not takes any argument or returns.
## nw service object
_nw service object_ is the real object that handles all network operations. As a pattern every function returns itself (chaining), except **chain** method.
Header value **content-type** is important before making a request if request has a body. Every request is prepared by its _content-type_. Every response is also parsed by its response  header **content-type** value and provided as object; if parsing fails then the response  body is provided as string.

### body
Function. Sets values in body of the request. In form it can be given as key-value pair,  first argument is key, second argument is value; in other scenarios it can be given as single parameter.
### header
Function. Sets the header values for the request in key-value format. First argument is key, second argument is value.
### query
Function. Sets the query string values for the request in key-value format. First argument is key, second argument is value.
### path
Function. Formats the string in path. Each argument is provided as argument to formatter.
### result
Function. Takes a function as an argument. This function is called after network operation for the service completes. This function has two arguments in _error-first-pattern_ **err** and **data**. Structure of both argument are same objects. _data_ is null for unsuccessful response or on a network error; _err_ is null on a successful response as defined in _nw.requestSuccessValidator_.
#### result arguments
Objects have following properties:
- **status**: http status
- **body**: body object|string of the response
- **header**: header object of the response
- **next**: Boolean.In _chained flow_ if this is set to false within the function, chain will not continue.

### chain
Creates an another _nw service object_ by the given _service definition name_ (string) in a _chained flow_. In this case it does not returns the _original nw service object_ instead it returns **new nw service object**
### run
Function. Runs the services according to the _flow_. Making an actual call and retrieving values from server.
### mock
Function. Does not run the service! Instead executes them in _flow_ after 300ms fires _result_ with the values given in service definition in **mock** field.

# Flow
**run** and **mock** methods of the _nw service object_ executed in flows.
## Normal Flow
1. **nw.onActivityStart** event is fired
2. Service is executed
3.  _&lt;nw service object&gt;.result_ is handled
4. **nw.onActivityEnd** event is fired 

## Chained Flow
1. **nw.onActivityStart** event is fired
2. First _nw service object_ is executed
3. First _&lt;nw service object&gt;.result_ is handled
4. If there are no more _nw service object_ (s) in chain, go to step **9**
5. If the **next** value is true (which is by default) continue. If not go to step **9**
6. Execute next _nw service object_ in chain
7. Handle _&lt;nw service object&gt;.result_ in chain
8. Continue with next  _nw service object_ in chain: Go to step **4**
9. **nw.onActivityEnd** event is fired 