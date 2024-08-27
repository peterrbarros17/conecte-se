import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import SocialMediaIcons from ".";

describe("SocialMediaIcons component", () => {
  it("should render links of social media", () => {
    render(<SocialMediaIcons />);
    const listOfLinksMedia = screen.getAllByRole("link");
    expect(listOfLinksMedia).toHaveLength(5);
  });
});
