import '@testing-library/jest-dom'

// Mock next/image globally
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={typeof src === 'object' ? '' : src} alt={alt} className={className} />
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}))

// Mock static asset imports (png, jpg, etc.)
vi.mock('@/assets/coffe.png', () => ({ default: '/coffe.png' }))
vi.mock('@/assets/cat.png', () => ({ default: '/cat.png' }))
vi.mock('@/assets/cactus.png', () => ({ default: '/cactus.png' }))
