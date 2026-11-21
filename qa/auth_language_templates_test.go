package templates

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"
	"testing"
)

func TestConfirmationAndRecoveryEmails(t *testing.T) {
	languages := strings.Fields("es en de nl fr it pl uk ru zh-Hans ar sv fi nb da")
	for _, flow := range []string{"confirmation", "recovery"} {
		tpl, err := template.ParseFiles("../supabase/templates/" + flow + ".html")
		if err != nil {
			t.Fatal(err)
		}
		for _, language := range languages {
			for _, site := range []string{"https://cocoenforma.com", "https://staging.test/"} {
				t.Run(fmt.Sprintf("%s/%s/%s", flow, language, site), func(t *testing.T) {
					redirect := strings.TrimRight(site, "/") + "/"
					if flow == "recovery" {
						redirect += "?coco_recuperar=1"
					}
					if language != "es" {
						sep := "?"
						if flow == "recovery" {
							sep = "&"
						}
						redirect += sep + "lang=" + language
					}
					var body bytes.Buffer
					const link = "https://auth.example/verify?token=example"
					err := tpl.Execute(&body, map[string]any{
						"SiteURL": site, "Data": map[string]any{"locale": "de"},
						"ConfirmationURL": link, "RedirectTo": redirect,
					})
					if err != nil {
						t.Fatal(err)
					}
					direction := "ltr"
					if language == "ar" {
						direction = "rtl"
					}
					out := body.String()
					if !strings.Contains(out, fmt.Sprintf("lang=%q dir=%q", language, direction)) || strings.Count(out, link) != 1 {
						t.Fatalf("incorrect locale, direction or verification link")
					}
				})
			}
		}
	}
}
