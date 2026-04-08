package devices

import "testing"

func TestNormalizePlatform(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{name: "macos", in: "macos", want: "macos"},
		{name: "windows", in: "windows", want: "windows"},
		{name: "linux", in: "linux", want: "linux"},
		{name: "web", in: "web", want: "web"},
		{name: "android", in: "android", want: "android"},
		{name: "fallback", in: "something-else", want: "unknown"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizePlatform(tc.in)
			if got != tc.want {
				t.Fatalf("normalizePlatform(%q) = %q, want %q", tc.in, got, tc.want)
			}
		})
	}
}
