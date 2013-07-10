require 'rubygems'
require 'json'
require 'rake/clean'

CLEAN.include ['*.xpi', '*.rdf']
xpi_url = 'https://autopagerize.heroku.com/files/autopagerize_for_firefox-latest.xpi'
rdf_url = 'https://autopagerize.heroku.com/files/autopagerize_for_firefox.update.rdf'
dir = '/Users/youhei/dev/heroku/autopagerize/public/files'
# xpi_url = 'https://relucks-org.appspot.com/autopagerize/autopagerize-latest.xpi'
# rdf_url = 'https://relucks-org.appspot.com/autopagerize/update.rdf'
dir_old = '/Users/youhei/dev/appengine/relucks-org/files'

task :_xpi do
  sh "cfx xpi --update-link='#{xpi_url}' --update-url='#{rdf_url}'"
end

desc 'deploy'
task :deploy => :update do
  v = JSON.parse(IO.read('package.json'))['version']
  sh "cp autopagerize.xpi #{dir}/autopagerize_for_firefox-latest.xpi"
  sh "cp autopagerize.xpi #{dir}/autopagerize_for_firefox-#{v}.xpi"
  sh "cp autopagerize.update.rdf #{dir}/autopagerize_for_firefox.update.rdf"
  # sh "cd /Users/youhei/dev/heroku/autopagerize/ && git add . && git push heroku master"

  # appengine old
  # sh "cp autopagerize.update.rdf #{dir_old}/update.rdf "
  # sh "cd #{dir_old}/.. && sh ./script/update"
end

desc 'update xpi'
task :update => [:clean, :_xpi] do
  v = JSON.parse(IO.read('package.json'))['version']
  # sh "cp autopagerize.xpi packages_/autopagerize_#{v}.xpi"
end
