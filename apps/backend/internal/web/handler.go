package web

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

type handler struct {
	indexFile  string
	fileServer http.Handler
	fsys       fs.FS
}

func NewHandler(distDir string) (http.Handler, error) {
	resolvedDistDir := strings.TrimSpace(distDir)
	if resolvedDistDir == "" {
		return nil, fmt.Errorf("web dist directory is empty")
	}

	indexFile := filepath.Join(resolvedDistDir, "index.html")
	indexInfo, err := os.Stat(indexFile)
	if err != nil {
		return nil, fmt.Errorf("web entry file not found: %w", err)
	}
	if indexInfo.IsDir() {
		return nil, fmt.Errorf("web entry file is a directory: %s", indexFile)
	}

	fsys := os.DirFS(resolvedDistDir)

	return &handler{
		indexFile:  indexFile,
		fileServer: http.FileServer(http.FS(fsys)),
		fsys:       fsys,
	}, nil
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !shouldServeWebRoute(r.URL.Path) {
		http.NotFound(w, r)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.NotFound(w, r)
		return
	}

	reqPath := cleanPath(r.URL.Path)
	if reqPath == "/" {
		http.ServeFile(w, r, h.indexFile)
		return
	}

	rel := strings.TrimPrefix(reqPath, "/")
	if rel == "" {
		http.ServeFile(w, r, h.indexFile)
		return
	}

	info, err := fs.Stat(h.fsys, rel)
	if err == nil && !info.IsDir() {
		h.fileServer.ServeHTTP(w, r)
		return
	}

	if path.Ext(reqPath) != "" {
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, h.indexFile)
}

func shouldServeWebRoute(requestPath string) bool {
	return requestPath != "/v1" && !strings.HasPrefix(requestPath, "/v1/") && requestPath != "/health"
}

func cleanPath(input string) string {
	cleaned := path.Clean("/" + input)
	if cleaned == "." {
		return "/"
	}
	return cleaned
}
