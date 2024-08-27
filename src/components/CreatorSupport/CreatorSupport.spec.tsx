import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import CreatorSupport from ".";

describe("CreatorSupport component", () => {
  it("should render name support creator", () => {
    render(<CreatorSupport />);
    const nameSupport = screen.getByText("Apoie o criador");
    expect(nameSupport).toBeInTheDocument();
  });

  it("should render name use code of creator", () => {
    render(<CreatorSupport />);
    const nameUseCode = screen.getByText(
      `Use code "UPETER-YT" na loja da epic games`
    );
    expect(nameUseCode).toBeInTheDocument();
  });
});
