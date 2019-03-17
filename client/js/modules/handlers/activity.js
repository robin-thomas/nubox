const moment = require('moment');

const Activity = require('../activity.js');

const ActivityHandler = {
  load: async (address) => {
    try {
      const activity = await Activity.getActivity(address);

      const getFileRow = (act, key, text) => {
        let row = null;
        if (act[key] !== undefined) {
          let itemRow = '';
          for (const file of act[key]) {
            const index = file.oldFileName.lastIndexOf('.');
            const fileName = file.oldFileName.substring(0, index - 1);
            const ext = file.oldFileName.substring(index + 1);

            let name = file.oldFileName;
            if (index !== -1) {
              name = `${fileName.substr(0, 3)}...${fileName.substr(fileName.length -4)}.${ext}`;
            }

            itemRow += `<div class="row no-gutters" style="font-size:11px">
                          <div class="col-md-1"></div>
                          <div class="col-md-11">
                            <i class="fas ${file.file ? 'fa-file' : 'fa-folder'}"></i>&nbsp;
                            ${name}&nbsp;
                            <i>${file.time}</i>
                          </div>
                        </div>`;
          }

          row = `<div class="row">
                  <div class="col">
                    You <b>${text}</b> ${act[key].length > 1 ? 'a few items' : 'an item'}
                  </div>
                </div>
                ${itemRow}
                <div class="row">&nbsp;</div>`;
        }

        return row;
      };

      $('#activity-dashboard-display').html('');
      for (const date of Object.keys(activity)) {
        let displayDate = moment(date).format('MMM D');
        if (moment().format('YYYY-MM-DD') === date) {
          displayDate = 'TODAY';
        } else if (moment().subtract(1, 'days').format('YYYY-MM-DD') === date) {
          displayDate = 'YESTERDAY';
        }

        const act = activity[date];

        const deleteRow = getFileRow(act, 'DELETE', 'deleted');
        const renameRow = getFileRow(act, 'RENAME', 'renamed');
        const uploadRow = getFileRow(act, 'UPLOAD', 'uploaded');
        const createRow = getFileRow(act, 'CREATE', 'created');

        const row = `<div class="row" style="border-bottom:1px solid rgb(218,220,224);padding:10px 0;text-align:left;">
                      <div class="col">
                        <div class="row" style="text-align:left;font-size:14px;color:rgba(0,0,0,0.6);margin-bottom:10px">
                          <div class="col">${displayDate}</div>
                        </div>
                        <div class="row no-gutters"  style="font-size:13px">
                          <div class="col-md-3" style="font-size:27px">
                            <i class="fas fa-user-astronaut"></i>
                          </div>
                          <div class="col-md-9">
                            ${deleteRow !== null ? deleteRow : ''}
                            ${renameRow !== null ? renameRow : ''}
                            ${uploadRow !== null ? uploadRow : ''}
                            ${createRow !== null ? createRow : ''}
                          </div>
                        </div>
                      </div>
                    </div>`;
        $('#activity-dashboard-display').append(row);
      }

      const el = new SimpleBar($('#activity-dashboard-display')[0]);
      el.recalculate();
    } catch (err) {
      throw err;
    }
  }
};

module.exports = ActivityHandler;
