import { fireEvent, render, screen } from "@testing-library/react-native";
import SearchBar from "@/components/SearchBar";

describe("as a shortcut (onPress only, like Home)", () => {
    test("pressing the bar calls onPress", async () => {
        const onPress = jest.fn();

        await render(<SearchBar placeholder="Search for a movie" onPress={onPress} />);
        await fireEvent.press(screen.getByRole("button", { name: "Search for a movie" }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    // no TextInput at all: nothing can take focus, open the keyboard, or be tabbed to on web
    test("shows the placeholder without a text field", async () => {
        await render(<SearchBar placeholder="Search for a movie" onPress={jest.fn()} />);

        expect(screen.getByText("Search for a movie")).toBeTruthy();
        expect(screen.queryByPlaceholderText("Search for a movie")).toBeNull();
    });
});

describe("as an input (onChangeText, like Search)", () => {
    test("passes typed text to onChangeText", async () => {
        const onChangeText = jest.fn();

        await render(
            <SearchBar placeholder="Search for a movie" value="" onChangeText={onChangeText} />
        );
        await fireEvent.changeText(screen.getByPlaceholderText("Search for a movie"), "dune");

        expect(onChangeText).toHaveBeenCalledWith("dune");
    });

    test("is not presented as a button", async () => {
        await render(<SearchBar placeholder="Search for a movie" value="" onChangeText={jest.fn()} />);

        expect(screen.queryByRole("button")).toBeNull();
    });
});
