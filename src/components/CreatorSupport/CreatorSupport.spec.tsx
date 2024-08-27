import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import CreatorSupport from ".";

describe("CreatorSupport component", () => {
  //Appearance Tests
  it("should render the paragraphs with the correct text and class", () => {
    render(<CreatorSupport />);

    const firstParagraph = screen.getByText("Apoie o criador");
    expect(firstParagraph).toBeInTheDocument();

    const secondParagraph = screen.getByText(
      'Use code "UPETER-YT" na loja da epic games'
    );
    expect(secondParagraph).toBeInTheDocument();

    const thirdParagraph = screen.getByText("Envie uma donate para o streamer");
    expect(thirdParagraph).toBeInTheDocument();

    const paragraphElements = screen.getAllByRole("paragraph");
    paragraphElements.forEach((p, index) => {
      if (index >= 1) {
        expect(p).toHaveClass("w-1/2 bg-white text-black p-4 rounded-md");
      } else {
        expect(p).not.toHaveClass("w-1/2 bg-white text-black p-4 rounded-md");
      }
    });

    expect(screen.getAllByRole("paragraph")).toMatchSnapshot();
  });
});
