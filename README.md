# Overview

* YAML definition syntax for defining a JSON schema.
* Type validation based on the definitions.
* YAML/JS REST API endpoint definition syntax.
* Automatic form generator for testing REST API endpoints.
* Test runner which uses a dependency graph to maximize test throughput.

# Type definitions

The validation definitions use the YAML structure for object attributes and interprets strings as type names.  Basic scalar types such as `string` and `int` support value lists, using the format `int{1,2-4}`.  Values like `guid?` are syntactic sugar for `guid|null`, and `?` on an attribute name means that the attribute is optional.  For instance, in the following example, `Layer.Update` inherits from `Layer.Any`, adds the optional `description` attribute, and changes the `type` and `params` attributes from required to optional.  When overriding inherited attributes, if no value is specified, the inherited value is left unchanged.  Multiple inheritance is supported, as well as single inheritance from branch types.  In this example, `Layer.Create` inherits from `Layer.Any`, which validates either defined object type.  Inheritance from branch types like this is syntactic sugar to reduce the number of intermediate definitions and improve clarity.

```yaml
Layer:

  WfsFeature:
    name: string
    namespace: string

  Wms:
    type: string{WMS}
    params:
      url: string
      layers: string[]
  
  Wfs:
    type: string{WFS}
    params:
      url: string
      features: WfsFeature[]
  
  Any: Wms|Wfs
  
  Create:
    ^: Any
    name: string
    description: string?
  
  Update:
    ^: Any
    description?: string
    type?:
    params?:
  
  Map: string => Any
  
  List: Any[]
```

# Test runner usage

```
import { squalus, collection } from 'squalus';
import Auth from './Authentication/Auth';
import Layers from './Layers/Layers';
import path from 'path';

squalus.execute(
  __dirname,
  collection('all')
    .groups([
      Auth,
      Layers,
    ]),
  path.join(__dirname, '/All.context.json')
);
```

```
import { group, test } from 'squalus';

export default group('auth')
  .tests([
    test('admin login')
      .post('/login')
      .json(context => ({
        Username: context.get('adminUser'),
        Password: context.get('adminPassword'),
      }))
      .expect('Login.Response')
      .save('adminSessionCookie', response => response.headers['set-cookie'][0]),
  ]);
```

# Endpoint Definitions

```yaml
- url: "api/test/{id}"
  method: POST
  headers:
    Authorization?: string
  urlParams:
    id: int
  queryParams:
    page: uint
    rows: uint
  data: Test.ObjectAll

- url: "test/ObjectAll"
  method: GET
```

# Endpoint Tests

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>API</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.2.0/require.min.js"></script>
    <script>
        require.config({
            paths: {
                squalus: '../node_modules/squalus/lib/squalus',
            },
        });
        require(['squalus'], function(squalus) {
            squalus.default.build(
                'http://example.com',
                '/test-api/Api.yaml',
                '/test-api/Types.yaml'
            );
        });
    </script>
</head>
<body>
</body>
</html>
```

# TODO

* When branching instances are specified, it should be in such a way that there is a unique field that can be used as a discrimination key for determining which branch to test.  This helps with performance, and also with error messages, because they can return the specific match failure, rather than the generic "does not match any candidates".  This has not yet been implemented in this version.

* Internally, `Map` supports having a minimum set of `required` fields, but this currently has no YAML syntax support.  The `required` is basically a way to create a custom object that doesn't strip off unknown attributes.

* Add additional built-in validation types, such as `url`.
