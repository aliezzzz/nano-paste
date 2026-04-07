package files

import (
	"net/http/httptest"
	"testing"
)

func TestSignedDownloadURLReturnsRelativePath(t *testing.T) {
	r := httptest.NewRequest("GET", "http://example.com/v1/files/abc/prepare-download", nil)
	got := signedDownloadURL(r, "2cdc06f6-c990-4652-8b76-aec93d041838", "")

	want := "/v1/files/download/2cdc06f6-c990-4652-8b76-aec93d041838"
	if got != want {
		t.Fatalf("signedDownloadURL() = %q, want %q", got, want)
	}
}

func TestSignedDownloadURLIncludesAccessToken(t *testing.T) {
	r := httptest.NewRequest("GET", "http://example.com/v1/files/abc/prepare-download", nil)
	got := signedDownloadURL(r, "file-1", "token with + and ?")

	want := "/v1/files/download/file-1?access_token=token+with+%2B+and+%3F"
	if got != want {
		t.Fatalf("signedDownloadURL() = %q, want %q", got, want)
	}
}
