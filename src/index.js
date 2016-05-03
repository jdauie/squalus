import Squalus from './Squalus';
import docReady from 'es6-docready';
import yaml from 'js-yaml';

docReady(() => {
  const spec = yaml.safeLoad(`
id: foo1
url: "some/url/{id}"
method: PUT
params:
  id: int
data:
  type: object
  attributes:
    Attr1: int{1,2,4}?
    Attr2:
      type: string[]
    Attr3:
      type: array
      item: string
    Attr4:
      type: object
      required: true
      attributes:
        SubAttr1: bool
        SubAttr2: int
    Attr5:
      type: int
      values: [56, 10324]
    Attr6: int|float|null
    Attr7:
      type: any
      branches: [string, float]
    Attr8:
      type: any
      branches:
        BranchName1: string
        BranchName2:
          type: object
          attributes:
            SubAttr1: string[]?
  `);

  Squalus.build([
    spec,
  ]);

  // Squalus.build([
  //   {
  //     id: 'foo1',
  //     endpoint: {
  //       url: 'some/url/<id>',
  //       method: 'PUT',
  //     },
  //     type: {
  //       class: 'Object',
  //       name: 'someobj',
  //       attributes: [
  //         {
  //           class: 'Attribute',
  //           name: 'Attr1',
  //           type: {
  //             class: 'Scalar',
  //             type: {
  //               name: 'int',
  //             },
  //           },
  //         },
  //         {
  //           class: 'Attribute',
  //           name: 'Attr2',
  //           type: {
  //             class: 'Scalar',
  //             type: {
  //               name: 'string',
  //             },
  //           },
  //         },
  //       ],
  //     },
  //     params: {
  //       id: {
  //         name: 'int',
  //       },
  //     },
  //   },
  // ]);
});
