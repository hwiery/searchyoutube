# 로고 및 파비콘 파일 안내

이 폴더에는 다음 파일들을 추가해주세요:

1. favicon.ico - 웹사이트 파비콘 (32x32 또는 16x16 픽셀)
2. favicon-16x16.png - 16x16 픽셀 파비콘
3. favicon-32x32.png - 32x32 픽셀 파비콘
4. apple-touch-icon.png - 애플 기기용 터치 아이콘 (180x180 픽셀 권장)
5. logo.png - 웹사이트 로고 이미지

파일이 준비되면 이 폴더에 추가한 후, src/components/navbar.tsx 파일에서 로고 이미지 관련 주석을 해제하여 사용할 수 있습니다.

## 로고 이미지 사용 방법

1. logo.png 파일을 이 폴더에 추가합니다.
2. src/components/navbar.tsx 파일에서 다음 부분을 찾습니다:

```tsx
{/* 로고 이미지 (현재는 텍스트로 대체) */}
{/* 나중에 로고 이미지가 준비되면 아래 주석을 해제하고 텍스트 부분을 주석 처리하세요 */}
{/* <img src="/assets/logo.png" alt="SearchYoutube" className="h-8 w-auto mr-2" /> */}
<span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600 mr-2">
  SearchYoutube
</span>
```

3. 주석을 해제하고 텍스트 부분을 주석 처리합니다:

```tsx
{/* 로고 이미지 */}
<img src="/assets/logo.png" alt="SearchYoutube" className="h-8 w-auto mr-2" />
{/* <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600 mr-2">
  SearchYoutube
</span> */}
``` 