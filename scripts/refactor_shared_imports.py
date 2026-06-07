from pathlib import Path
import re

root = Path('apps/throwl/src')
replacements = {
    'components/AppBar/AppBar': '@throwl/shared-ui',
    'components/AppHeader/AppHeader': '@throwl/shared-ui',
    'components/AppModal/AppModal': '@throwl/shared-ui',
    'components/FormInput/FormInput': '@throwl/shared-ui',
    'components/Loader/Loader': '@throwl/shared-ui',
    'components/LogoButton/LogoButton': '@throwl/shared-ui',
    'components/AppLogo': '@throwl/shared-ui',
    'components/ClickableDartboard/ClickableDartboard': '@throwl/shared-ui',
    'components/Preloader/Preloader': '@throwl/shared-ui',
    'components/Swipeable/SwipeActions': '@throwl/shared-ui',
    'components/TurnIndicatorBar/TurnIndicatorBar': '@throwl/shared-ui',
    'components/WinnerModal/WinnerModal': '@throwl/shared-ui',
    'components/Accordion': '@throwl/shared-ui',
    'layouts/FullScreen/FullScreen': '@throwl/shared-layouts',
    'App/theming': '@throwl/shared-theme',
}

pattern = re.compile(r"from\s+(['\"])(?:\.{1,2}/)*(" + '|'.join(re.escape(k) for k in replacements) + r")\1")

updated_files = []
for path in root.rglob('*.ts*'):
    content = path.read_text(encoding='utf-8')
    new_content = content

    def repl(match):
        quote = match.group(1)
        key = match.group(2)
        return f"from {quote}{replacements[key]}{quote}"

    new_content = pattern.sub(repl, new_content)
    if new_content != content:
        path.write_text(new_content, encoding='utf-8')
        updated_files.append(str(path))

print(f'updated {len(updated_files)} files')
for f in updated_files:
    print(f)
