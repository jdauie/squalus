import Definition from './Definition';
import Any from './Type/Any';
import Vector from './Type/Vector';
import Attribute from './Type/Attribute';

export default class Squalus {

  static build(tests) {
    tests.forEach(test => {
      const def = new Definition(test.id, test.endpoint, test.type, test.params);
      def.build();
    });

    const events = {
      change: {
        'select.test-option': Any.onChange,
      },
      click: {
        '.tab-container > ul > li': Definition.onTabSwitch,
        '.test-row-add': Vector.onClickAdd,
        '.test-row-remove': Vector.onClickRemove,
        '.test-attr-toggle': Attribute.onClickToggle,
        '.test-edit': Definition.onEdit,
        '.test-submit': Definition.onSubmit,
      },
      keypress: {
        'input[type=text],input[type=checkbox],select': Definition.onKeyPress,
      },
    };

    const root = document.getElementById('test-event-root');

    Object.keys(events).forEach(type => {
      root.addEventListener(type, e => {
        if (e.target) {
          const def = Definition.closest(e.target);
          if (def) {
            Object.keys(events[type]).forEach(selector => {
              if (e.target.matches(selector)) {
                const func = events[type][selector];
                func(e, def);
              }
            });
          }
        }
      });
    });
  }
}
