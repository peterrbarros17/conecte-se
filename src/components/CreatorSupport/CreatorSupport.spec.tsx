import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import CreatorSupport from ".";

describe("CreatorSupport component", () => {
  it("should render support heading, creator code and donation link", () => {
    render(<CreatorSupport />);

    expect(screen.getByText("Apoie o criador")).toBeInTheDocument();
    expect(screen.getByText("UPETER-YT")).toBeInTheDocument();
    expect(screen.getByText("Fazer uma doação")).toBeInTheDocument();

    const donationLink = screen.getByRole("link", {
      name: /fazer uma doação/i,
    });
    expect(donationLink).toHaveAttribute("href", "https://livepix.gg/upeter");
  });
});
