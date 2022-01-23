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

///////////////// vars ////////////////////////////////////////////
let nextUnitOfWork = null;

///////////////// enums ////////////////////////////////////////////
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

  fiber.props.children.map((child) => render(child, dom));

  return dom;
};
// perform unit of work
const performUnitOfWork = (fiber) => {
  console.log("processing ", fiber);

  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

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
  console.log("processing ended");
  // next unit of work child=>sibling=>uncle
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
};

// workloop
const workloop = (deadline) => {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    let timeRemaining = deadline.timeRemaining();
    shouldYield = timeRemaining < 1;
    console.log(shouldYield, timeRemaining);
  }

  window.requestIdleCallback(workloop);
};

const render = (element, container) => {
  // set nextunitOfWork to the root of the fiber tree
  nextUnitOfWork = { dom: container, props: { children: [element] } };

  //  start asynchronous rendering;
  window.requestIdleCallback(workloop);
};

const Didact = { createElement, createTextElement, render };

/////////////////////////////////////////////////////////////

const element = (
  <div id="foo" style="background:red">
    <a>bar</a>
    <b />
    <div>
      baz<p>boo</p>
    </div>
  </div>
);

const container = document.getElementById("root");
Didact.render(element, container);
