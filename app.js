/////////////////////////////
// my own react     ////////
///////////////////////////

///////////////// data structures ///////////////
// const fiber = {
//   type: "string",
//   dom: "dom element",
//   props: { ...props, children: [] },
// };

///////////////////// not a comment do not delete ///////////////////////////
/** @jsx Didact.createElement */

///////////////// VARS ////////////////////////////////////////////
let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletion = null;

///////////////// ENUMS ////////////////////////////////////////////
const elementTypes = Object.freeze({ TEXT_ELEMENT: "TEXT_ELEMENT" });

///////////////////////  functions /////////////////////////////
const isProperty = (key) => key !== "children";

///////////////// apis ////////////////////////////////////////////

// create fiber
const createElement = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children: children.map((child) =>
      typeof child === "object" ? child : createTextElement(child)
    ),
  },
});
// create fiber for text
const createTextElement = (text) => ({
  type: elementTypes.TEXT_ELEMENT,
  props: { nodeValue: text, children: [] },
});

// createDom
const createDom = (fiber) => {
  // create dom node
  const dom =
    fiber.type === elementTypes.TEXT_ELEMENT
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // attach attributes; attributes are all props keys besides key === 'children'

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  // add event listeners
  Object.keys(fiber.props)
    .filter(isEvent)
    .forEach((name) => {
      const eventType = name.toLocaleLowerCase().substring(2);
      dom.addEventListener(eventType, fiber.props[name]);
    });

  return dom;
};
// perform unit of work
const performUnitOfWork = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // get children
  const elements = fiber.props.children;
  // let index = 0;
  // let prevSibling = null;
  // // CREATE children fibers and assign sibling if any
  // while (index < elements.length) {
  //   const currentEl = elements[index];

  //   const newFiber = {
  //     dom: null,
  //     type: currentEl.type,
  //     props: currentEl.props,
  //     parent: fiber,
  //   };

  //   if (index === 0) {
  //     fiber.child = newFiber;
  //   } else {
  //     prevSibling.sibling = newFiber;
  //   }
  //   prevSibling = newFiber;
  //   index++;
  // }

  reconcileChildren(fiber, elements);

  // next unit of work child=>sibling=>uncle
  // first next unit if work should be the its child if any
  if (fiber.child) {
    return fiber.child;
  }

  //  if childless, next unit of work is the nextSibling(s)
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // if it has no sibling then next unit is the uncle if any
    nextFiber = nextFiber.parent;
  }
};

// reconcileChildren
const reconcileChildren = (wipFiber, elements) => {
  let index = 0;
  let previousSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length || oldFiber) {
    const element = elements[index];

    const newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      // update props
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      // add node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      // delete old
      oldFiber.effectTag = "DELETION";
      deletion.push(oldFiber);
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      previousSibling.sibling = newFiber;
    }

    previousSibling = newFiber;
    index++;
  }
};

// workloop
// deadline :requestIdleCallbackObject   props {timeRemaining: fn. }
const workloop = (deadline) => {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    let timeRemaining = deadline.timeRemaining();
    shouldYield = timeRemaining < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  window.requestIdleCallback(workloop);
};

// commitRoot
const commitRoot = () => {
  deletion.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
};

// commitWork
const commitWork = (fiber) => {
  if (!fiber) {
    return;
  }

  const domParent = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION" && fiber.dom != null) {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const isGone = (next) => (key) => !(key in next);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isEvent = (key) => key.startsWith("on");

// updateDom
const updateDom = (dom, prevProps, nextProps) => {
  // remove old props(attributes)
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => (dom[name] = ""));

  // remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLocaleLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // add event listener
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLocaleLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });

  // set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => (dom[name] = nextProps[name]));
};

const render = (element, container) => {
  // keep track of the root of the fiber tree

  wipRoot = {
    dom: container,
    props: { children: [element] },
    alternate: currentRoot,
  };

  deletion = [];

  // set the next unit of work
  nextUnitOfWork = wipRoot;
};

const Didact = { createElement, createTextElement, render };

/////////////////////////////////////////////////////////////

const container = document.getElementById("root");

const updateValue = (e) => rerender(e.target.value);

const rerender = (value = "") => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h1>Hello {value}</h1>
    </div>
  );

  Didact.render(element, container);
};

rerender();

window.requestIdleCallback(workloop);
