import path from 'path'
import mkdirp from 'mkdirp'
import {Promise} from 'bluebird'
import slug from 'limax'
import inquirer from 'inquirer'
import clc from 'cli-color'

import {config, Manager, coreUtils, cmsThemes, User} from '../../'

export default class initSite {
  constructor() {}

  init(pathSite) {
    var p = new Promise(resolve => {
      Manager.instance
        .init()
        .then(() => {
          Manager.instance.pathTemplates = path.join(
            config.root,
            config.themes.path,
            config.themes.name,
            config.themes.templates.path
          )
          Manager.instance.pathPartials = path.join(
            config.root,
            config.themes.path,
            config.themes.name,
            config.themes.partials.path
          )

          pathSite = pathSite.split(path.sep)
          pathSite[pathSite.length - 1] = slug(pathSite[pathSite.length - 1], {
            separateNumbers: false
          })
          pathSite = pathSite.join(path.sep)

          this.addFolder(pathSite)
            .then(() => {
              process.chdir(pathSite)
              this.addFolder(config.publish.url)
              this.addFolder(config.structure.url)
              this.addFolder(config.reference.url)
              this.addFolder(config.data.url)
              this.addFolder(
                Manager.instance.pathTemplates.replace(
                  config.root + path.sep,
                  ''
                )
              )
              this.addFolder(
                Manager.instance.pathPartials.replace(
                  config.root + path.sep,
                  ''
                )
              )
              resolve()
            })
            .catch(function(e) {
              console.error(e.stack)
              resolve()
            })
        })
        .catch(function(e) {
          console.error(e.stack)
          resolve()
        })
    })

    return p
  }

  addFolder(folder) {
    var p = new Promise(resolve => {
      mkdirp.sync(folder)
      resolve()
    })

    return p
  }

  updateSecurity(answers) {
    var p = new Promise(resolve => {
      if (answers.security) {
        console.log('Installing Abe security layer')
        let json = {}
        let createLocalConfig = true

        if (config.localConfigExist()) {
          json = config.getLocalConfig()
          createLocalConfig = false
        }

        const confUsers = {enable: true}

        if (!createLocalConfig) {
          if (typeof json.users === 'undefined' || json.users === null) {
            json.users = confUsers
          } else {
            if (json.users.enable == false) {
              json.users = confUsers
            }
          }
        } else {
          json.users = confUsers
          console.log(
            'Creating a local config file abe.json',
            clc.cyan.underline(
              'https://github.com/abecms/abecms/blob/master/docs/abe-config.md'
            )
          )
        }

        config.save(json)
        const u = {
          username: answers.username,
          name: answers.username,
          email: answers.email,
          password: answers.password,
          role: {
            workflow: 'admin',
            name: 'Admin'
          }
        }
        User.manager.instance.update([])
        var admin = User.operations.add(u)
        User.operations.activate(admin.user.id)
      }

      resolve()
    })

    return p
  }

  updateTheme(answers) {
    var p = new Promise(resolve => {
      if (answers.theme) {
        if (answers.which !== 'Your own template') {
          console.log('installing the theme ' + answers.which)
          cmsThemes.themes
            .downloadTheme(
              'https://github.com/abecms/theme-' +
                answers.which +
                '/archive/master.zip',
              answers.which
            )
            .then(function(resp) {
              resolve()
            })
            .catch(function(e) {
              resolve()
            })
        } else {
          if (answers.url.indexOf('//') > -1) {
            console.log('installing theme from url:' + answers.url)
            resolve()
          } else {
            console.log(
              'installing the theme ' + answers.url + ' from themes.abecms.io'
            )
            cmsThemes.themes
              .downloadTheme(
                'https://github.com/abecms/theme-' +
                  answers.which +
                  '/archive/master.zip',
                answers.which
              )
              .then(function(resp) {
                resolve()
              })
              .catch(function(e) {
                resolve()
              })
          }
        }
      } else {
        resolve()
      }
    })

    return p
  }

  /*
  {
    type : 'checkbox',
    name : 'plugins',
    choices: [
      'abecms/abe-deployer-git', 
      'abecms/abe-deployer-sftp', 
      'abecms/abe-deployer-s3', 
      'abecms/abe-packagz', 
      'abecms/abe-sitemap', 
      'abecms/abe-elasticsearch', 
      'abecms/abe-algolia'
    ],
    message : 'Select the plugins you want to install'
  }
*/
  askQuestions() {
    var p = new Promise(resolve => {
      inquirer
        .prompt([
          {
            type: 'input',
            name: 'name',
            message:
              "Enter the name of the project you want to create (only letters and '-' allowed)"
          },
          {
            type: 'confirm',
            name: 'theme',
            message: 'Do you want to install a theme ?',
            default: true
          },
          {
            type: 'list',
            name: 'which',
            choices: ['default', 'multiverse', 'lens', 'Your own template'],
            message: 'Please select a theme',
            default: 0,
            when: function(answers) {
              return answers.theme
            }
          },
          {
            type: 'input',
            name: 'url',
            message: 'Enter the url of the theme or enter a theme name from ',
            when: function(answers) {
              return answers.which == 'Your own template' ? true : false
            }
          },
          {
            type: 'confirm',
            name: 'security',
            message: 'Do you activate the user management ?',
            default: true
          },
          {
            type: 'input',
            name: 'username',
            message: 'Enter the username',
            default: 'admin',
            when: function(answers) {
              return answers.security
            }
          },
          {
            type: 'input',
            name: 'email',
            message: 'Enter the email address',
            default: 'admin@test.com',
            when: function(answers) {
              return answers.security
            },
            validate: function(value) {
              var pass = value.match(coreUtils.mail.regexEmail)
              if (pass) {
                return true
              }

              return 'Please enter a valid email address'
            }
          },
          {
            type: 'password',
            name: 'password',
            message: 'Enter the password',
            default: 'Adm1n@test',
            when: function(answers) {
              return answers.security
            },
            validate: function(value, answers) {
              var cPassword = User.utils.commonPassword({
                username: answers.username,
                password: value
              })
              if (cPassword.success === 0) {
                return 'The password must be at least 10 characters long with no sequences of three or more repeated characters, at least one uppercase letter, one number and one special character.'
              }

              return true
            }
          },
          {
            type: 'checkbox',
            name: 'plugins',
            choices: [
              {
                key: 'a',
                name: 'abe-deployer-git: Deploy your website on GIT',
                value: 'abecms/abe-deployer-git'
              },
              {
                key: 'b',
                name:
                  'abe-deployer-sftp: Deploy your website through FTP or SFTP',
                value: 'abecms/abe-deployer-sftp'
              },
              {
                key: 'c',
                name: 'abe-deployer-s3: Deploy your website to S3',
                value: 'abecms/abe-deployer-s3'
              },
              {
                key: 'd',
                name: 'abe-packagz: Create individual zip of a post on publish',
                value: 'abecms/abe-packagz'
              },
              new inquirer.Separator(),
              {
                key: 'e',
                name: 'abe-elasticsearch: Index your posts on ElasticSearch',
                value: 'abecms/abe-elasticsearch'
              },
              {
                key: 'f',
                name: 'abe-algolia: Index your posts on Algolia',
                value: 'abecms/abe-algolia'
              },
              new inquirer.Separator(),
              {
                key: 'g',
                name: 'abe-sitemap: Add a XML Sitemap to your website',
                value: 'abecms/abe-sitemap'
              },
              {
                key: 'h',
                name:
                  'abe-mailer: Create contact Forms on your website and send emails',
                value: 'wonknu/abe-mailer'
              },
              {
                key: 'i',
                name: 'abe-datepicker: Add a datepicker to your Abe editor',
                value: 'wonknu/abe-datepicker'
              },
              {
                key: 'i',
                name:
                  'abe-rangeslider: Position a abe text with absolute coordinates on images',
                value: 'wonknu/abe-rangeslider'
              }
            ],
            message: 'Select the plugins you want to install'
          }
        ])
        .then(function(answers) {
          resolve(answers)
        })
    })
    return p
  }
}
