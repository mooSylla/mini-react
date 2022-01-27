/////////////////////////////
// my own react     ////////
///////////////////////////

///////////////// data structures ///////////////
// const fiber = {
//   type: "string",
//   dom: "dom element",
//   props: { ...props, children: [] },
// };
////////////////////////////////////////////////
/** @jsx Didact.createElement */

///////////////// VARS ////////////////////////////////////////////
let nextUnitOfWork = null;
let wipRoot = null;

///////////////// ENUMS ////////////////////////////////////////////
const elementTypes = Object.freeze({ TEXT_ELEMENT: "TEXT_ELEMENT" });

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
  const isProperty = (key) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  // fiber.props.children.map((child) => render(child, dom));

  return dom;
};
// perform unit of work
const performUnitOfWork = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // get children
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;
  // CREATE children fibers and assign sibling if any
  while (index < elements.length) {
    const currentEl = elements[index];

    const newFiber = {
      dom: null,
      type: currentEl.type,
      props: currentEl.props,
      parent: fiber,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }

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
  commitWork(wipRoot.child);
  wipRoot = null;
};

// commitWork
const commitWork = (fiber) => {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const render = (element, container) => {
  // keep track of the root of the fiber tree

  wipRoot = { dom: container, props: { children: [element] } };

  // set the next unit of work
  nextUnitOfWork = wipRoot;

  // start asynchronous rendering;
  window.requestIdleCallback(workloop);
};

const Didact = { createElement, createTextElement, render };

/////////////////////////////////////////////////////////////

const element = (
  <div id="foo" style="background:red">
    <a>bar</a>
    <b />
    <div>
      <p>boo</p>
      <span style="background:blue">baz</span>
    </div>
  </div>
);

const container = document.getElementById("root");
Didact.render(element, container);
