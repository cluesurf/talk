text: clean
	@lualatex talk.tex
	@bibtex talk || true
	@lualatex talk.tex
	@lualatex talk.tex
.PHONY: text

# Build with pdflatex, the engine arXiv uses by default.
pdf: clean
	@pdflatex -interaction=nonstopmode talk.tex
	@bibtex talk || true
	@pdflatex -interaction=nonstopmode talk.tex
	@pdflatex -interaction=nonstopmode talk.tex
.PHONY: pdf

# Build the arXiv source bundle: compile with pdflatex (to generate talk.bbl,
# which arXiv needs since it does not run bibtex), stage only the source files,
# and zip them. Upload arxiv-submission.zip to arxiv.org.
arxiv: pdf
	@rm -rf arxiv-submission arxiv-submission.zip
	@mkdir -p arxiv-submission/text
	@cp talk.tex talk.bib talkfirst.bst talk.bbl arxiv-submission/
	@cp text/*.tex arxiv-submission/text/
	@cd arxiv-submission && zip -r -X ../arxiv-submission.zip . > /dev/null
	@echo "arXiv bundle ready: arxiv-submission.zip"
.PHONY: arxiv

clean:
	@rm -f *.aux *.log *.out *.toc *.lof *.lot *.bbl *.blg *.thm
.PHONY: clean
