import { render } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("рендерит основную область main#main", () => {
    render(<App />);
    expect(document.querySelector("main#main")).not.toBeNull();
  });
});
