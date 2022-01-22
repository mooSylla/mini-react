/////////////////////////////
// my own react     ////////
///////////////////////////
/** @jsx Didact.createElement */

///////////////// apis ////////////////////////////////////////////
const elementTypes = Object.freeze({ TEXT_ELEMENT: "TEXT_ELEMENT" });

const createElement = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children: children.map((child) =>
      typeof child === "object" ? child : createTextElement(child)
    ),
  },
});

const createTextElement = (text) => ({
  type: elementTypes.TEXT_ELEMENT,
  props: { nodeValue: text, children: [] },
});

const Didact = { createElement, createTextElement, render };

/////////////////////////////////////////////////////////////

const render = (element, container) => {
  // create dom nodes and update the dom
  const parentNode =
    element.type === elementTypes.TEXT_ELEMENT
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      parentNode[name] = element.props[name];
    });

  element.props.children.map((child) => render(child, parentNode));
  container.appendChild(parentNode);
};

// const element = { type: "h1", props: { title: "foo", children: "Hello" } };
// const element = Didact.createElement("h1", { title: "foo" }, "hello");

const element = (
  <div id="foo" style="background:red">
    <a>bar</a>
    <b />
    <div>baz</div>
  </div>
);

const container = document.getElementById("root");
Didact.render(element, container);
