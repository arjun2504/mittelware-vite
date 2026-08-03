import { Switch, useMantineColorScheme } from "@mantine/core";
import { FaSun, FaMoon } from "react-icons/fa6";

const ThemeToggle = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme({ keepTransitions: true });
  const isDark = colorScheme === 'dark';

  return (
    <Switch
      aria-label="Toggle color scheme"
      checked={isDark}
      onChange={(event) => setColorScheme(event.currentTarget.checked ? 'dark' : 'light')}
      size='md'
      color='violet'
      onLabel={<FaMoon size={12} />}
      offLabel={<FaSun size={12} />}
    />
  );
};

export default ThemeToggle;
