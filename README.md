<h1 align="center">Material Symbols React</h1>

Use [Google's Material Symbols (icons)](https://fonts.google.com/icons?icon.set=Material+Symbols) in React with ease.

<div align="center">

[![NPM version][npm-image]][npm-url]
[![Downloads][download-image]][npm-downloads]
![npm-typescript]
[![GitHub License](https://img.shields.io/badge/license-Apache--2.0-green)](./LICENSE)

</div>

- [Installation](#installation)
- [Usage](#usage)
  - [Importing](#importing)
  - [Component Props](#component-props)
- [License](#license)

## Installation

```sh
# npm
npm install @nine-thirty-five/material-symbols-react

# yarn
yarn add @nine-thirty-five/material-symbols-react

# pnpm
pnpm add @nine-thirty-five/material-symbols-react
```

## Usage

`@nine-thirty-five/material-symbols-react` provides three Material icon **variants** in both **_default_** and **_filled_** types.

Icon variants are:

- Outlined
- Rounded
- Sharp

### Importing

There are two ways to import an icon based on your prefered type and variant.

```ts
// Outlined variant
import { Search } from '@nine-thirty-five/material-symbols-react/outlined';
import { Home } from '@nine-thirty-five/material-symbols-react/outlined/filled';

// Rounded variant
import { Star } from '@nine-thirty-five/material-symbols-react/rounded';
import { Favorite } from '@nine-thirty-five/material-symbols-react/rounded/filled';

// Sharp variant
import { Delete } from '@nine-thirty-five/material-symbols-react/sharp';
import { Login } from '@nine-thirty-five/material-symbols-react/sharp/filled';
```

### Component Props

Icon component support all props that a React SVG component supports.

```ts
// Sample props
<Search className="yourClassName" />
<Home style={{fill: 'red'}} />
<Star height='1rem' width='1rem' />
<Favorite height={16} width={16} />
<Delete fill='red' />
<Login viewBox='0 0 24 24' />
```

## License

Material design icons are created by [Google](https://github.com/google/material-design-icons#license).

> We have made these icons available for you to incorporate into your products under the Apache License Version 2.0. Feel free to remix and re-share these icons and documentation in your products. We'd love attribution in your app's about screen, but it's not required.

[npm-url]: https://www.npmjs.com/package/@nine-thirty-five/material-symbols-react
[npm-image]: https://img.shields.io/npm/v/@nine-thirty-five/material-symbols-react
[download-image]: https://img.shields.io/npm/dm/@nine-thirty-five/material-symbols-react
[npm-downloads]: https://www.npmjs.com/package/@nine-thirty-five/material-symbols-react
[github-license]: https://img.shields.io/github/license/nine-thirty-five/material-symbols-react
[github-license-url]: https://github.com/nine-thirty-five/material-symbols-react/blob/master/LICENSE
[github-build]: https://github.com/nine-thirty-five/material-symbols-react/actions/workflows/publish.yml/badge.svg
[github-build-url]: https://github.com/nine-thirty-five/material-symbols-react/actions/workflows/publish.yml
[npm-typescript]: https://img.shields.io/npm/types/@nine-thirty-five/material-symbols-react
[license]: https://github.com/nine-thirty-five/material-symbols-react/blob/main/LICENSE
